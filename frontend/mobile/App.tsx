import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, I18nManager, Linking, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';

/**
 * MORSHID for Android: a native shell around the MORSHID website (the same content as the web
 * app). The site address comes from app.json → expo.extra.webUrl. Pages of that site open inside
 * the app; every other link (photo credits, official sources, mailto/tel) opens outside it.
 */
const WEB_URL: string = (Constants.expoConfig?.extra?.webUrl as string | undefined) ?? 'https://morshid-three.vercel.app';

/** "https://host[:port]" in lower case — a regex, since React Native's URL lacks some getters */
function originOf(url: string): string | null {
  const match = /^(https?:\/\/[^/?#]+)/i.exec(url);
  return match ? match[1]!.toLowerCase() : null;
}
const WEB_ORIGIN = originOf(WEB_URL);

// The site sets its own direction (ar = RTL, en = LTR); the native shell must not mirror it again
I18nManager.allowRTL(false);

// Keep the native splash screen until the first page has loaded (or failed)
void SplashScreen.preventAutoHideAsync();

const COLORS = {
  light: { page: '#FAF8F3', ink: '#252820', muted: '#5E5A50', primary: '#10619F' },
  dark: { page: '#161512', ink: '#F3EFE6', muted: '#B5AE9F', primary: '#6CC0FB' },
};

/** Bilingual on purpose: the error can appear before the site (and its language) has loaded. */
const OFFLINE = {
  title: 'تعذّر الاتصال · Can’t connect',
  body: 'تأكد من اتصالك بالإنترنت ثم حاول مرة ثانية.\nCheck your internet connection and try again.',
  retry: 'إعادة المحاولة · Try again',
};

function isInternal(url: string): boolean {
  if (url.startsWith('about:') || url.startsWith('blob:') || url.startsWith('data:')) return true;
  return WEB_ORIGIN !== null && originOf(url) === WEB_ORIGIN;
}

function openExternally(url: string) {
  Linking.openURL(url).catch(() => {
    // No app can handle it: nothing to do
  });
}

function Shell() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = COLORS[scheme];
  const webview = useRef<WebView>(null);
  const canGoBack = useRef(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Android back button / gesture: go back inside the site first, then leave the app
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack.current && !failed) {
        webview.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [failed]);

  const onNavigationStateChange = useCallback((state: WebViewNavigation) => {
    canGoBack.current = state.canGoBack;
  }, []);

  const onShouldStartLoadWithRequest = useCallback((request: { url: string }) => {
    if (isInternal(request.url)) return true;
    openExternally(request.url);
    return false;
  }, []);

  const retry = () => {
    setFailed(false);
    setAttempt((a) => a + 1);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.page }]} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {failed ? (
        <View style={styles.center}>
          <Text style={[styles.title, { color: colors.ink }]}>{OFFLINE.title}</Text>
          <Text style={[styles.body, { color: colors.muted }]}>{OFFLINE.body}</Text>
          <Pressable accessibilityRole="button" onPress={retry} style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}>
            <Text style={styles.buttonText}>{OFFLINE.retry}</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          key={attempt}
          ref={webview}
          source={{ uri: WEB_URL }}
          style={{ backgroundColor: colors.page }}
          originWhitelist={['https://*', 'http://*', 'about:*', 'blob:*', 'data:*']}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onNavigationStateChange={onNavigationStateChange}
          // Links with target="_blank" (photo credits, official sources) open in the browser
          setSupportMultipleWindows
          onOpenWindow={(event) => openExternally(event.nativeEvent.targetUrl)}
          onLoadEnd={() => SplashScreen.hide()}
          onError={() => {
            setFailed(true);
            SplashScreen.hide();
          }}
          onHttpError={(event) => {
            // Only a failed first page is fatal; a 404 inside the site shows the site's own page
            if (event.nativeEvent.statusCode >= 500 && !canGoBack.current) setFailed(true);
          }}
          startInLoadingState
          renderLoading={() => (
            <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: colors.page }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          allowsBackForwardNavigationGestures
          mediaPlaybackRequiresUserAction
          overScrollMode="never"
          // Lets the website recognise the app if it ever needs to (e.g. hide "get the app" prompts)
          applicationNameForUserAgent="MorshidApp/1.0"
        />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  button: { marginTop: 8, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
