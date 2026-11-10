#!/bin/bash
TARGET_APP_ID=$1
TARGET_APP_NAME=$2

echo "Patching for $TARGET_APP_NAME ($TARGET_APP_ID)..."

# 1. Update build.gradle
sed -i "s/applicationId \".*\"/applicationId \"$TARGET_APP_ID\"/g" android/app/build.gradle

# 2. Update Android strings.xml
sed -i "s|<string name=\"app_name\">.*</string>|<string name=\"app_name\">$TARGET_APP_NAME</string>|g" android/app/src/main/res/values/strings.xml
sed -i "s|<string name=\"title_activity_main\">.*</string>|<string name=\"title_activity_main\">$TARGET_APP_NAME</string>|g" android/app/src/main/res/values/strings.xml

# 3. Google Services JSON me package name match karane ke liye dummy match ensure karein (taaki crash na ho)
sed -i "s/\"package_name\": \".*\"/\"package_name\": \"$TARGET_APP_ID\"/g" android/app/google-services.json || true
