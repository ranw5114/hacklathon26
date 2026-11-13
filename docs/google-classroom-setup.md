# Setting up "Sign in with Google" for Google Classroom

The To-Do list can read a student's Google Classroom assignments directly (and check off the ones
they've already turned in). Google needs to know about the app first. This takes about 15 minutes
and is done once by whoever runs the site. Until it's done, the "Sign in with Google" button is
hidden, and students can still sync each class with its calendar link.

## 1. Create a Google Cloud project
1. Go to https://console.cloud.google.com and sign in with a personal Google account (school accounts often can't create projects).
2. At the top, click the project menu → **New project**. Name it "Chick Study Buddy" → **Create**.

## 2. Turn on the Google Classroom API
1. Menu → **APIs & Services** → **Library**.
2. Search for **Google Classroom API** → **Enable**.

## 3. Set up the consent screen (what students see when signing in)
1. **APIs & Services** → **OAuth consent screen** (it may be called "Google Auth Platform" → **Branding**).
2. User type: **External**. App name: "Chick Study Buddy". Add your email as support and developer contact.
3. **Scopes** (or **Data access**): add these two, both read-only:
   - `https://www.googleapis.com/auth/classroom.courses.readonly`
   - `https://www.googleapis.com/auth/classroom.coursework.me.readonly`
4. **Test users** (or **Audience**): add the Google accounts that will use it (up to 100), e.g. your own
   and your teammates'. While the app is in "Testing", only these accounts can sign in.

## 4. Create the client ID
1. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
2. Application type: **Web application**.
3. **Authorized JavaScript origins**: add
   - `https://hacklathon26.vercel.app`
   - `http://localhost:3000` (for running it on your own computer)
   (No redirect URIs are needed.)
4. **Create**, then copy the **Client ID** (it ends in `.apps.googleusercontent.com`). It isn't a secret.

## 5. Give the client ID to the app
- **Vercel**: Project → **Settings** → **Environment Variables** → add
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = your client ID → **Save**, then redeploy (Deployments → ⋯ → Redeploy).
- **Your own computer**: add the same line to `.env.local` and restart `npm run dev`.

## Things to know
- **Testing mode**: only the test users from step 3 can sign in, and Google shows an "unverified app"
  warning (click **Continue**). Letting anyone sign in requires Google's verification review.
- **School accounts**: some schools only allow apps their admin has approved. If a student sees
  "access blocked", their school admin has to allow the app, or they can use the calendar-link option.
- **Privacy**: the app only asks for read-only access. The sign-in token stays in the browser for
  that visit and is never stored or sent to our server.
