import crypto from "crypto";
import { BrowserWindow } from "@electron/remote";

const authBase = "https://quaily.com";
const apiBase = "https://api.quail.ink";
const clientID = "866c9dba-e267-47b8-ad48-2ca9105dd3cd";
const redirectURI = "http://localhost:63812/oauth/code";
const scopes = ["user.full", "post.write"];

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function generateCodeVerifier() {
  return base64UrlEncode(crypto.randomBytes(32));
}

function getCodeFromUrl(url) {
  const redirectUrl = new URL(url);
  const code = redirectUrl.searchParams.get('code');
  const returnedState = redirectUrl.searchParams.get("state") || "";
  return { code: code || "", returnedState };
}

function generateCodeChallengeS256(codeVerifier) {
  const digest = crypto.createHash("sha256").update(codeVerifier).digest();
  return base64UrlEncode(digest);
}

function generateState() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return base64UrlEncode(crypto.randomBytes(16));
}

async function startLoginElectron() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallengeS256(codeVerifier);
  const state = generateState();

  // Construct the authorization URL
  const authURL = new URL("/oauth/authorize", authBase);
  authURL.searchParams.set("response_type", "code");
  authURL.searchParams.set("client_id", clientID);
  authURL.searchParams.set("redirect_uri", redirectURI);
  authURL.searchParams.set("scope", scopes.join(" "));
  authURL.searchParams.set("state", state);
  authURL.searchParams.set("code_challenge", codeChallenge);
  authURL.searchParams.set("code_challenge_method", "S256");

  // Open a window to show the provider’s login/consent page
  const loginWindow = new BrowserWindow({
    width: 600,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  return new Promise((resolve, reject) => {
    let completed = false;

    const isCallbackUrl = (url) => {
      try {
        return url.startsWith(redirectURI);
      } catch {
        return false;
      }
    };

    const cleanup = () => {
      loginWindow.webContents.removeListener("will-navigate", onWillNavigate);
      loginWindow.webContents.removeListener("will-redirect", onWillRedirect);
      loginWindow.removeListener("closed", onClosed);
    };

    const finish = async (promise) => {
      if (completed) return;
      completed = true;
      cleanup();
      try {
        const token = await promise;
        resolve(token);
      } catch (err) {
        reject(err);
      } finally {
        if (!loginWindow.isDestroyed()) {
          loginWindow.close();
        }
      }
    };

    const handleCallback = async (url) => {
      const { code, returnedState } = getCodeFromUrl(url);
      if (returnedState !== state) {
        throw new Error("State mismatch. Potential CSRF attack or lost session.");
      }
      if (!code) {
        throw new Error("No authorization code found in callback.");
      }
      return await exchangeCodeForToken(code, codeVerifier, redirectURI);
    };

    const onWillNavigate = (event, url) => {
      if (!isCallbackUrl(url)) return;
      event.preventDefault();
      void finish(handleCallback(url));
    };

    const onWillRedirect = (event, url) => {
      if (!isCallbackUrl(url)) return;
      event.preventDefault();
      void finish(handleCallback(url));
    };

    const onClosed = () => {
      if (completed) return;
      completed = true;
      cleanup();
      reject(new Error("Login window closed before completing authentication."));
    };

    loginWindow.webContents.on("will-navigate", onWillNavigate);
    loginWindow.webContents.on("will-redirect", onWillRedirect);
    loginWindow.on("closed", onClosed);

    // Load the authorization URL
    loginWindow.loadURL(authURL.toString()).catch((err) => {
      void finish(Promise.reject(err));
    });
  });
}

/**
 * Exchange an authorization code + code_verifier for an access token.
 *
 * @param {string} code
 * @param {string} verifier
 * @param {string} redirectURI
 */
async function exchangeCodeForToken(code, verifier, redirectURI) {
  // token endpoint
  const tokenURL = new URL("/oauth/token", apiBase);

  // Build form data
  const bodyData = new URLSearchParams();
  bodyData.set("grant_type", "authorization_code");
  bodyData.set("code", code);
  bodyData.set("redirect_uri", redirectURI);
  bodyData.set("client_id", clientID);
  bodyData.set("code_verifier", verifier);

  const response = await fetch(tokenURL.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: bodyData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token endpoint error: ${response.status} ${errorText}`);
  }

  // Return JSON: { access_token, refresh_token, expires_in, ... }
  return await response.json();
}

async function refreshToken(refreshToken) {
  const tokenURL = new URL("/oauth/token", apiBase);

  const data = new URLSearchParams();
  data.set("grant_type", "refresh_token");
  data.set("refresh_token", refreshToken);
  data.set("client_id", clientID);

  const resp = await fetch(tokenURL.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: data,
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Refresh token error: ${resp.status} ${errorText}`);
  }

  return await resp.json();
}

export {
  startLoginElectron,
  exchangeCodeForToken,
  refreshToken
}
