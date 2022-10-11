import { Layout, Row, Col, Space, Tag, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';

import styles from './Home.module.scss';
import AppTreeView from '~/components/AppTreeView';
import api from '~/api';

const cx = classNames.bind(styles);
const { Header, Content, Footer } = Layout;

export default function Home() {
    const [value, setValue] = useState();

    useEffect(() => {}, []);

    return (
        <Layout className="layout">
            <Header
                className={cx('header')}
                style={{ backgroundImage: 'linear-gradient(to right,  #EB344A , #F45943)' }}
            >
                <Row>
                    <Col xs={18} sm={16} md={14} lg={10}>
                        <Space>
                            <Tag color="#355D7F">FILES: </Tag>
                            <AppTreeView changeObject={setValue} />
                        </Space>
                    </Col>
                    <Col xs={6} sm={6} md={8} lg={2}>
                        <Button type="primary" size="large">
                            Function
                        </Button>
                    </Col>
                </Row>
            </Header>
            <Content
                style={{
                    padding: '0 50px',
                }}
            >
                <div className="site-layout-content">{value}</div>
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
