import { create } from 'zustand';

interface AuthFlowState {
  // Temporary password storage during auth flow
  tempPassword: string | null;
  tempEmail: string | null;

  // Reset password flow
  resetPasswordEmail: string | null;
  resetPasswordToken: string | null;

  // Actions
  setTempCredentials: (email: string, password: string) => void;
  getTempCredentials: () => { email: string | null; password: string | null };
  setResetPasswordData: (email: string, token: string) => void;
  getResetPasswordData: () => { email: string | null; token: string | null };
  clearTempCredentials: () => void;
  clearResetPasswordData: () => void;
  clearAll: () => void; // Clear everything when user successfully signs in
}

export const useAuthFlowStore = create<AuthFlowState>((set, get) => ({
  // Initial state
  tempPassword: null,
  tempEmail: null,
  resetPasswordEmail: null,
  resetPasswordToken: null,

  // Set temporary credentials (for sign up → verify → sign in flow)
  setTempCredentials: (email: string, password: string) => {
    set({ tempEmail: email, tempPassword: password });
  },

  // Get temporary credentials
  getTempCredentials: () => {
    const { tempEmail, tempPassword } = get();
    return { email: tempEmail, password: tempPassword };
  },

  // Set reset password data (for forgot password flow)
  setResetPasswordData: (email: string, token: string) => {
    set({ resetPasswordEmail: email, resetPasswordToken: token });
  },

  // Get reset password data
  getResetPasswordData: () => {
    const { resetPasswordEmail, resetPasswordToken } = get();
    return { email: resetPasswordEmail, token: resetPasswordToken };
  },

  // Clear temporary credentials
  clearTempCredentials: () => {
    set({ tempPassword: null, tempEmail: null });
  },

  // Clear reset password data
  clearResetPasswordData: () => {
    set({ resetPasswordEmail: null, resetPasswordToken: null });
  },

  // Clear everything (call this when user successfully signs in)
  clearAll: () => {
    set({
      tempPassword: null,
      tempEmail: null,
      resetPasswordEmail: null,
      resetPasswordToken: null,
    });
  },
}));
