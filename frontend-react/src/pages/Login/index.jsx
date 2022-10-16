import React, { useEffect } from 'react';
import LoginMaster from '~/components/LoginMaster';
import LoginComponent from '~/components/LoginMaster/Login';
import { useTranslation } from 'react-i18next';
import cookies from 'js-cookie';

export default function Login() {
    const { t } = useTranslation();

    useEffect(() => {
        document.title = t('login');
    }, [t]);

    const submitForm = (values) => {
      console.log('Success:', values);
      // TODO: post api login
      if (values.remember) {
          cookies.set('account', JSON.stringify(values));
      } else {
          cookies.remove('account');
      }
    }

    const submitFailed = (errorInfo) => {
      console.log('submitFailed:', errorInfo);
    }

    return (
        <LoginMaster>
            <LoginComponent submitForm={submitForm} submitFailed={submitFailed}/>
        </LoginMaster>
    );
}
