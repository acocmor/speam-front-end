import { Layout, Row, Col, Space, Tag, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';

import styles from './Home.module.scss';
import AppTreeView from '~/components/AppTreeView';
import AppViewer from '~/components/AppViewer';
import api from '~/api';
import axios from 'axios';
import ChangeLanguage from '~/components/ChangeLanguage';
import Sidebar from '~/components/Sidebar';
import ListFile from '~/components/ListFile';

const cx = classNames.bind(styles);
const { Header, Content, Footer } = Layout;

export default function Home() {
    const [bucketObject, setBucketObject] = useState({});
    const [token, setToken] = useState(null);
    const [urn, setUrn] = useState(null);
    const [pathExternalExtensions, setPathExternalExtensions] = useState(['./assets/js/Measure.min.css']);

    useEffect(() => {
        api.get('forge/oauth/token')
            .then((response) => {
                console.log('app token', response.data.dictionary);
                setToken(response.data.dictionary);
            })
            .catch((err) => console.log(err));
    }, []);

    useEffect(() => {
        if (bucketObject) {
            setUrn(null);
            let axiosConfig = {
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Access-Control-Allow-Origin': '*',
                },
            };

            axios({
                url: 'http://localhost:5000/api/forge/modelderivative/jobs',
                method: 'post',
                data: bucketObject,
                headers: axiosConfig,
            })
                .then((response) => {
                    console.log('bucketObject', response.data.dictionary.urn);
                    setUrn(response.data.dictionary.urn);
                })
                .catch((err) => console.log(err));
        } else {
            console.log('------------------------------------');
        }
    }, [bucketObject]);

    const onClickButton = (e) => {};

    return (
        <div className={cx('home-container')}>
            <Row className={cx('home-container')}>
                <Col xs={10} sm={8} md={8} lg={8} xl={6} xxl={4}>
                    <Sidebar />
                </Col>
                <Col xs={14} sm={16} md={16} lg={16} xl={18} xxl={20}>
                    <ListFile />
                </Col>
            </Row>
        </div>
    );
}
