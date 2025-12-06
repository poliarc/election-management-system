declare global {
    interface Window {
        google?: {
            translate: {
                TranslateElement: {
                    new(
                        config: {
                            pageLanguage: string;
                            includedLanguages: string;
                            layout: number;
                        },
                        element: HTMLElement | null
                    ): void;
                    InlineLayout: {
                        SIMPLE: number;
                        HORIZONTAL: number;
                        VERTICAL: number;
                    };
                };
            };
        };
        googleTranslateElementInit?: () => void;
    }
}

export { };
