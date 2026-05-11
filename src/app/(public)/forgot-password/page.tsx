import type { Metadata } from "next";
import { ForgotPasswordFlow } from "./ForgotPasswordFlow";

export const metadata: Metadata = {
    title: "Reset Password",
    description: "Recover your uunn account using your 24-word recovery key. Email-based reset is not available — your recovery key is the only way back in.",
};

export default function ForgotPasswordPage() {
    return <ForgotPasswordFlow />;
}
