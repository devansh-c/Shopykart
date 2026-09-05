import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.in.shopykart.app',
    appName: 'ShopyKart',
      webDir: 'out',
        server: {
            androidScheme: 'https',
                cleartext: true,
                    allowNavigation: [
                          'shopykart.co.in',
                                '*.shopykart.co.in'
                                    ]
                                      },
                                        plugins: {
                                            SplashScreen: {
                                                  launchShowDuration: 3000,
                                                        launchAutoHide: true,
                                                              backgroundColor: "#ffffffff",
                                                                    androidScaleType: "CENTER_CROP",
                                                                          showSpinner: false,
                                                                                splashFullScreen: true,
                                                                                      splashImmersive: true
                                                                                          }
                                                                                            }
                                                                                            };

                                                                                            export default config;
