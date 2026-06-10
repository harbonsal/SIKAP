import { usePage } from '@inertiajs/react';

export default function ApplicationLogo(props) {
    const { app_settings } = usePage().props;
    return (
        <img
            {...props}
            src={app_settings?.app_logo || "/images/logo.png"}
            alt="Logo"
        />
    );
}
