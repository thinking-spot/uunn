import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Settings",
    description: "Manage your profile, union settings, and account — including permanent data deletion.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
