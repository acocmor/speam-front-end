import { Layout, Row, Col, Space, Tag, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';

import styles from './Home.module.scss';
import AppTreeView from '~/components/AppTreeView';
import AppViewer from '~/components/AppViewer';
import api from '~/api';
import axios from 'axios';

const cx = classNames.bind(styles);
const { Header, Content, Footer } = Layout;

export default function Home() {
    const [bucketObject, setBucketObject] = useState({});
    const [token, setToken] = useState(null);
    const [urn, setUrn] = useState(null);
    const [pathExternalExtensions, setPathExternalExtensions] = useState(['./js/Measure.min.css']);

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

    const onClickButton = (e) => {

    };

    return (
        <Layout className="layout">
            <Header
                className={cx('header')}
                style={{ backgroundImage: 'linear-gradient(to right,  #EB344A , #F45943)' }}
            >
                <Row>
                    <Col xs={20} sm={18} md={16} lg={10}>
                        <Space>
                            <Tag color="#355D7F">FILES: </Tag>
                            <AppTreeView changeObject={setBucketObject} />
                        </Space>
                    </Col>
                    <Col xs={4} sm={6} md={8} lg={2}>
                        <Button type="primary" size="large" onClick={onClickButton}>
                            Function
                        </Button>
                    </Col>
                </Row>
            </Header>
            <Content>
                <div className="site-layout-content">
                    {token && urn ? <AppViewer token={token.access_token} urn={urn} pathExternalExtensions={pathExternalExtensions}/> : ''}
                </div>
            </Content>
            <Footer
                style={{
                    textAlign: 'center',
                }}
            >
                SPEAM DEMO
            </Footer>
        </Layout>
    );
}
