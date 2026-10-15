import type { LocalizedText } from '@/shared/api';

/**
 * Photos used by the public website (hero scenes, journal covers, destination collections).
 * Same licensed local files as the destination catalogue (docs/image-credits.md, D-044): every
 * entry carries its author, license and source page, shown wherever the photo appears.
 * These are site assets (like a CMS media library), so marketing pages render them immediately
 * instead of waiting for catalogue data.
 *
 * `illustrative` marks an image that does NOT show the subject itself (Expo 2030 Riyadh does not
 * exist yet: theme photos, and concept renderings of the future site) — the UI must say so.
 * `sourceUrl` is omitted when there is no public source page (the concept renderings).
 */
export type SiteMedia = {
  src: string;
  width: number;
  height: number;
  alt: LocalizedText;
  credit: string;
  license: string;
  sourceUrl?: string;
  illustrative?: LocalizedText;
};

const tx = (ar: string, en: string): LocalizedText => ({ ar, en });
const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;

/**
 * Concept renderings of the future Expo 2030 Riyadh site, supplied with the project
 * (expo-images/ → public/images/expo/concept; P-023). Never photographs, never the official plan;
 * their source and usage rights are still to be confirmed (docs/image-credits.md). The same files
 * back the Expo map (entities/expo EXPO_CONCEPT_IMAGES).
 */
const CONCEPT_CREDIT = 'Concept rendering · supplied with the project (source and rights to be confirmed)';
const concept = (file: string, width: number, height: number, ar: string, en: string): SiteMedia => ({
  src: `/images/expo/concept/${file}`,
  width,
  height,
  alt: tx(ar, en),
  credit: CONCEPT_CREDIT,
  license: 'Unconfirmed',
  illustrative: tx('تصوّر تصميمي — ليس صورة فوتوغرافية', 'Concept rendering — not a photograph'),
});

export const SITE_MEDIA = {
  // Expo 2030 Riyadh concept renderings (illustrative — the site is not built yet)
  expoSiteNight: concept('site-aerial-night.png', 1893, 607, 'تصوّر جوي ليلي لموقع إكسبو 2030 الرياض', 'Night aerial concept rendering of the Expo 2030 Riyadh site'),
  expoSiteDusk: concept('site-aerial-dusk.jpg', 1200, 480, 'تصوّر جوي لموقع إكسبو 2030 الرياض عند الغروب', 'Dusk aerial concept rendering of the Expo 2030 Riyadh site'),
  expoTowerDusk: concept('tower-dusk.jpg', 1200, 480, 'تصوّر لبرج الحدائق وساحات الزوار عند الغروب', 'Concept rendering of the garden tower and visitor terraces at dusk'),
  expoGatheringPlaza: concept('gathering-plaza.jpg', 1200, 479, 'تصوّر لساحة تجمّع للزوار عند الغروب', 'Concept rendering of a visitor gathering plaza at sunset'),
  expoTowerGarden: concept('tower-garden.webp', 591, 751, 'تصوّر لبرج مظلّل وسط حدائق وممرات', 'Concept rendering of a shaded tower among gardens and walkways'),
  expoTowerInterior: concept('tower-interior.webp', 591, 751, 'تصوّر لمنصات مضيئة داخل هيكل شجري', 'Concept rendering of illuminated platforms inside a tree-like structure'),
  expoConePavilions: concept('cone-pavilions.webp', 591, 751, 'تصوّر لأجنحة مخروطية بزخارف هندسية', 'Concept rendering of cone-shaped pavilions with geometric patterns'),
  masmak: { src: '/images/places/masmak.jpg', width: 1280, height: 853, alt: tx('واجهة قصر المصمك الطينية وأبراجه', 'The clay walls and towers of Masmak Fortress'), credit: 'Sammy Six · CC BY 2.0 · Wikimedia Commons', license: 'CC BY 2.0', sourceUrl: commons('Masmak_Fortress_(6329473680).jpg') },
  nationalMuseum: { src: '/images/places/national-museum.jpg', width: 1280, height: 853, alt: tx('أروقة المتحف الوطني السعودي', 'The arcades of the National Museum of Saudi Arabia'), credit: 'Sammy Six · CC BY 2.0 · Wikimedia Commons', license: 'CC BY 2.0', sourceUrl: commons('National_Museum_Riyadh_(6329553512).jpg') },
  murabba: { src: '/images/places/murabba.jpg', width: 1280, height: 853, alt: tx('فناء قصر المربع مضاءً ليلًا', 'The courtyard of Murabba Palace, lit at night'), credit: 'saudipics · CC BY-SA 4.0 · Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: commons('Murabba_Palace.jpg') },
  turaif: { src: '/images/places/turaif.jpg', width: 1280, height: 960, alt: tx('زقاق بين جدران الطين في حي الطريف', 'A lane between mud-brick walls in At-Turaif'), credit: 'Radosław Botev · CC BY 3.0 pl · Wikimedia Commons', license: 'CC BY 3.0 pl', sourceUrl: commons('At-Turaif_District_in_ad-Dir%27iyah_(3).jpg') },
  edgeOfTheWorld: { src: '/images/places/edge-of-the-world.jpg', width: 1280, height: 856, alt: tx('زوار على منحدر حافة العالم عند الغروب', 'Visitors on a cliff at the Edge of the World at sunset'), credit: 'S0lL0 TRAVELER · CC BY-SA 4.0 · Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: commons('Edge_of_the_World.jpg') },
  kingdomCentre: { src: '/images/places/kingdom-centre.jpg', width: 1280, height: 850, alt: tx('برج المملكة وفتحته العلوية', 'Kingdom Centre and its open top arch'), credit: 'Wajahat Mahmood from Perth, Australia · CC BY-SA 2.0 · Wikimedia Commons', license: 'CC BY-SA 2.0', sourceUrl: commons('Kingdom_Centre,_Riyadh_(6129688934).jpg') },
  kafd: { src: '/images/places/kafd.jpg', width: 1280, height: 960, alt: tx('أبراج مركز الملك عبدالله المالي في الرياض', 'The towers of King Abdullah Financial District in Riyadh'), credit: 'Ahmed · CC BY-SA 4.0 · Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: commons('King_Abdullah_Financial_District_20230411_114859.jpg') },
  hegra: { src: '/images/places/hegra.jpg', width: 1280, height: 837, alt: tx('نقش منحوت فوق واجهة مقبرة نبطية في الحجر', 'A carved pediment over a Nabataean tomb façade at Hegra'), credit: 'Carole Raddato from FRANKFURT, Germany · CC BY-SA 2.0 · Wikimedia Commons', license: 'CC BY-SA 2.0', sourceUrl: commons("Qasr_al-Bint_Necropolis,_Tomb_30,_Hegra_(Mada%27in_Salih),_the_kingdom%27s_second_Nabatean_capital_after_Petra,_Saudi_Arabia_-_53534779696.jpg") },
  historicJeddah: { src: '/images/places/historic-jeddah.jpg', width: 1280, height: 853, alt: tx('بيوت جدة التاريخية برواشينها الخشبية', 'Historic Jeddah houses with wooden rawasheen'), credit: 'Anne and David · Public domain · Wikimedia Commons', license: 'Public domain', sourceUrl: commons('Old_Jeddah_(Al_Balad),_Saudi_Arabia_in_November_2022.jpg') },
  salamPark: { src: '/images/places/salam-park.jpg', width: 1280, height: 960, alt: tx('قارب على بحيرة منتزه السلام', 'A boat on the lake at Salam Park'), credit: 'Hamza A. Durrani · CC BY-SA 4.0 · Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: commons('Shuttle_Boat_Salam_Park_Riyadh_IMG_0404.jpg') },
  faisaliah: { src: '/images/places/faisaliah.jpg', width: 1280, height: 960, alt: tx('منطقة المشاهدة الزجاجية في برج الفيصلية', 'The glass viewing area inside Al Faisaliah Center'), credit: 'Jon Rawlinson · CC BY 2.0 · Wikimedia Commons', license: 'CC BY 2.0', sourceUrl: commons('Glass_view_at_the_Al_Faisaliyah_Center_(458003698).jpg') },
  elephantRock: { src: '/images/places/elephant-rock.jpg', width: 1280, height: 853, alt: tx('جبل الفيل في العُلا', 'Elephant Rock in AlUla'), credit: 'Richard Mortel · CC BY 2.0 · Wikimedia Commons', license: 'CC BY 2.0', sourceUrl: commons('Elephant_Rock_2020.jpg') },
  alQarah: { src: '/images/places/al-qarah.jpg', width: 1280, height: 960, alt: tx('جدران صخرية في جبل القارة', 'Limestone rock walls at Al-Qarah Mountain'), credit: 'Shijan Kaakkara · CC BY-SA 4.0 · Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: commons('Jabal_Al_Qara_Cave_-_Al_Hassa_08.jpg') },
  rijalAlmaa: { src: '/images/places/rijal-almaa.jpg', width: 1280, height: 960, alt: tx('بيوت رجال ألمع الحجرية', 'The stone houses of Rijal Almaa'), credit: 'Richard Mortel · CC BY 2.0 · Wikimedia Commons', license: 'CC BY 2.0', sourceUrl: commons('Rijal_Almaa_village_2021.jpg') },
  kingFahdFountain: { src: '/images/places/king-fahd-fountain.jpg', width: 1280, height: 960, alt: tx('نافورة الملك فهد مضاءة ليلًا', "King Fahd's Fountain lit at night"), credit: 'ほっきー · CC0 · Wikimedia Commons', license: 'CC0', sourceUrl: commons('King_Fahd%E2%80%99s_Fountain_2025.jpg') },
  // Expo theme photos (illustrative — photos of a theme, not of the fictional pavilions)
  expoTech: {
    src: '/images/expo/ai-tech.jpg',
    width: 1280,
    height: 853,
    alt: tx('روبوت بشري في معرض تقني', 'A humanoid robot at a technology exhibition'),
    credit: 'Om Umekar · CC BY-SA 4.0 · Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: commons('Humanoid_Robot_at_International_Exhibitions.jpg'),
    illustrative: tx('صورة توضيحية لموضوع التقنية', 'Illustrative photo of the technology theme'),
  },
  expoMobility: {
    src: '/images/expo/mobility.jpg',
    width: 1280,
    height: 871,
    alt: tx('داخل عربة قطار مترو الرياض', 'Inside a Riyadh Metro train car'),
    credit: 'ubahnverleih · CC0 · Wikimedia Commons',
    license: 'CC0',
    sourceUrl: commons('Riyadh_Metro_-_innoTrans_2016.jpg'),
    illustrative: tx('صورة توضيحية لموضوع التنقل', 'Illustrative photo of the mobility theme'),
  },
  expoCulture: {
    src: '/images/expo/culture.jpg',
    width: 1280,
    height: 720,
    alt: tx('خط عربي على قطع خشبية', 'Arabic calligraphy on wooden pieces'),
    credit: 'Mohammad Hijjawi · CC BY-SA 4.0 · Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: commons('Arabic_calligraphy_on_wood.jpg'),
    illustrative: tx('صورة توضيحية لموضوع الثقافة', 'Illustrative photo of the culture theme'),
  },
  expoSustainability: {
    src: '/images/expo/sustainability.jpg',
    width: 1280,
    height: 791,
    alt: tx('ألواح طاقة شمسية', 'Solar panels'),
    credit: 'Dennis Schroeder - NREL Photographer · Public domain · Wikimedia Commons',
    license: 'Public domain',
    sourceUrl: commons('Solar_panels_in_the_desert.jpg'),
    illustrative: tx('صورة توضيحية لموضوع الاستدامة', 'Illustrative photo of the sustainability theme'),
  },
} satisfies Record<string, SiteMedia>;

export type SiteMediaKey = keyof typeof SITE_MEDIA;
