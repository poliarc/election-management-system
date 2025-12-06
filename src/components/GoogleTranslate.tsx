import { useEffect, useRef } from "react";

const GoogleTranslate = () => {
    const googleTranslateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        const checkGoogleTranslate = () => {
            if (
                window.google &&
                window.google.translate &&
                window.google.translate.TranslateElement
            ) {
                if (intervalId) clearInterval(intervalId);

                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: "en",
                        includedLanguages: "en,hi,bn,as", // English, Hindi, Bengali, Assamese
                        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    },
                    googleTranslateRef.current
                );
            }
        };

        intervalId = setInterval(checkGoogleTranslate, 100);

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    return (
        <div className="google-translate-wrapper">
            <div ref={googleTranslateRef} className="google-translate-container"></div>
        </div>
    );
};

export default GoogleTranslate;
