import React, { useEffect } from 'react';
import LoginMaster from '~/components/LoginMaster';
import RegisterComponent from '~/components/LoginMaster/Register';
import { useTranslation } from 'react-i18next';

export default function Register() {
    const { t } = useTranslation();

    useEffect(() => {
        document.title = t('register');
    }, [t]);

    const submitForm = (values) => {
        console.log('Success:', values);
        // TODO: post api register
    };

    const submitFailed = (errorInfo) => {
        console.log('submitFailed:', errorInfo);
    };

    return (
        <LoginMaster>
            <RegisterComponent submitForm={submitForm} submitFailed={submitFailed} />
        </LoginMaster>
    );
}
