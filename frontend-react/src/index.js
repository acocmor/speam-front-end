import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import GlobalStyles from '~/components/GlobalStyles/index';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n.use(initReactI18next)
    .use(HttpApi)
    .use(LanguageDetector)
    .init({
        supportedLngs: ['en', 'de'],
        fallbackLng: 'en',
        debug: false,
        // Options for language detector
        detection: {
            order: ['path', 'cookie', 'htmlTag'],
            caches: ['cookie'],
        },
        backend: {
            loadPath: '/assets/locales/{{lng}}/translation.json',
        },
        // react: { useSuspense: false },
        interpolation: { escapeValue: false },
    });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    // <React.StrictMode>
    <Suspense fallback="Loading...">
        <GlobalStyles>
            <App />
        </GlobalStyles>
    </Suspense>,

    // </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
