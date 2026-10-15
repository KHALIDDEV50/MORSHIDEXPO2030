
package com.morshid.expo2030.API;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {

    private String message;
    private Object data;

    public ApiResponse(String message) {
        this.message = message;
        this.data = null;
    }
}
