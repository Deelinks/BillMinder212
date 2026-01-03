
export const biometricService = {
  isSupported: (): boolean => {
    return !!(window.PublicKeyCredential && 
              window.navigator.credentials && 
              window.navigator.credentials.create);
  },

  /**
   * Registers a new biometric credential on the device.
   * In a real production app, the challenge would come from your backend.
   */
  register: async (email: string): Promise<{ credentialId: string; publicKey: string } | null> => {
    try {
      if (!biometricService.isSupported()) {
        console.warn("WebAuthn is not supported or not available in this secure context.");
        return null;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userID = new TextEncoder().encode(email || 'guest_user');
      
      // RP ID must be the domain. For sandboxed environments, we use the current hostname.
      const rpId = window.location.hostname || 'localhost';

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "BillMinder",
          id: rpId,
        },
        user: {
          id: userID,
          name: email || "guest@billminder.app",
          displayName: email || "Guest User",
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) return null;

      // In production, you'd send credential.rawId to your server
      return {
        credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        publicKey: "stored_locally_for_mvp"
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        console.error("Biometric registration blocked. This usually happens if the site is not in a secure context (HTTPS) or the 'publickey-credentials-create' permission is not delegated to the frame.");
      } else {
        console.error("Biometric registration failed:", err);
      }
      return null;
    }
  },

  /**
   * Challenges the user with a biometric prompt (FaceID/Fingerprint).
   */
  authenticate: async (): Promise<boolean> => {
    try {
      if (!biometricService.isSupported()) return false;

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [], // Empty allows any platform authenticator on this RP
        userVerification: "required",
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      return !!assertion;
    } catch (err) {
      console.error("Biometric authentication failed:", err);
      return false;
    }
  }
};
