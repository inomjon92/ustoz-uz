plugins {
    id("com.android.application")
}

val siteUrl = (project.findProperty("siteUrl") as String?) ?: "https://ustoz-uz-beta.vercel.app"

android {
    namespace = "uz.ustoz.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "uz.ustoz.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
        buildConfigField("String", "SITE_URL", "\"$siteUrl\"")
    }

    buildFeatures { buildConfig = true }

    buildTypes {
        release {
            isMinifyEnabled = false
            // Sinov uchun debug kaliti bilan imzolanadi; Play Market uchun alohida release kaliti kerak
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
