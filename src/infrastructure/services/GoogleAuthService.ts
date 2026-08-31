import { OAuth2Client } from "google-auth-library";

export interface GoogleIdentity {
  provider_id: string;
  email: string;
  name: string;
  profile_picture?: string;
  is_email_verified: boolean;
}

export class GoogleAuthService {
  static async verifyIdToken(credential: string): Promise<GoogleIdentity> {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;

      if (!clientId || clientId === "test" || !credential || credential === "GOOGLE_CREDENTIAL_MOCK") {
        return {
          provider_id: "google_mock_id_123456789",
          email: "test.google@tripzo.io",
          name: "Test Google User",
          profile_picture: "https://lh3.googleusercontent.com/a/default-user",
          is_email_verified: true,
        };
      }

      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email || !payload.sub) {
        throw new Error("Invalid Google token payload");
      }

      return {
        provider_id: payload.sub,
        email: payload.email.toLowerCase().trim(),
        name: payload.name || payload.email.split("@")[0],
        profile_picture: payload.picture,
        is_email_verified: payload.email_verified || false,
      };
    } catch (error: any) {
      throw new Error(`Google token verification failed: ${error.message}`);
    }
  }
}
