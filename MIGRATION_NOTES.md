# React to React Native (Expo) Migration Notes

## Architecture Strategy
Instead of blindly rewriting the entire React.js frontend into React Native or duplicating complex backend logic, we extracted the data layer and core business logic into a new centralized location: `Fc_Savions/shared/lib`.
This guarantees that **both** your Web App (`test_Frontend`) and your Mobile App (`Application`) can use the exact same Firebase logic seamlessly without conflict.

## Step-by-step Execution:
1. **Created `shared/lib`:** Copied the backend API (`db/`), auth contexts (`context/`), and configuration (`firebase/`) from the web codebase into a standalone `shared` directory.
2. **Initialized Expo Mobile App:** Created the `Application` directory via Expo with TypeScript.
3. **Modified Metro Config:** Customized `metro.config.js` to watch the `../shared` folder so it easily resolves the shared files outside the standard project root.
4. **Modified TypeScript Config:** Mapped `@/lib/*` to `../shared/lib/*` inside `tsconfig.json`. This allows the mobile app to reuse the exact same import strings as the web app.
5. **Configured Environment Variables:** Extracted Next.js `NEXT_PUBLIC_*` Firebase variables into standard `EXPO_PUBLIC_*` variables within `Application/.env`. We updated `shared/lib/firebase/client.ts` to smartly fall back between Expo and Next.js variables, preventing crashes in either environment.
6. **Built Premium UI Screens:** Using the sophisticated Lumina SaaS dark-mode design system suggested by Stitch MCP, we built production-grade screens (`LoginScreen`, `SignupScreen`, and `DashboardScreen`) complete with smooth rounding, deep contrast, and Firebase Auth integration.
7. **Integrated Root Navigation:** Developed a dynamic routing system (`RootNavigator.tsx`) that conditionally renders authenticated vs. public screens automatically responding to Firebase Auth state changes.

## Android Compatibility
- `KeyboardAvoidingView` was configured with `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` to ensure inputs aren't obscured on Android devices.
- Replaced Web-native HTML tags (`div`, `span`) with proper Android-compatible primitive components (`View`, `Text`, `TextInput`).

## How to Run the App
To start developing and previewing your new mobile app, follow these steps:

1. Open a new terminal.
2. Navigate to the mobile app directory:
   ```bash
   cd Fc_Savions/Application
   ```
3. Start the Expo server:
   ```bash
   npx expo start -c
   ```
   *(Note: The `-c` flag clears the cache which is useful since we modified the Metro configuration).*
4. Press `a` in the terminal to open the app on an Android Emulator, or download the **Expo Go** app on your physical device and scan the generated QR code.

## Future Steps
As you continue moving components from the Web to Mobile, remember:
- Place any new shared hooks or API utilities in `shared/lib`.
- Your Web App can slowly be updated to import from `../../shared/lib` instead of `src/lib` once you are ready for full decoupling. Currently, we left the Web App entirely unbroken and intact.
