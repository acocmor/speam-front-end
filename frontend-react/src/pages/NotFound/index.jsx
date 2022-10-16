import React, { useCallback } from 'react';
import { Button, Result } from 'antd';
import './NotFound.module.scss';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const onBackHome = useCallback(() => {
        navigate('/');
    }, []);

    return (
        <Result
            status="404"
            title="404"
            subTitle={t('404_message')}
            extra={
                <Button className="btn-custom" type="primary" onClick={onBackHome}>
                    {t('back_home')}
                </Button>
            }
        />
    );
}
