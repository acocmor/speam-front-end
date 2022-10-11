import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';

import styles from './AppTreeView.module.scss';
import { TreeSelect, Tag } from 'antd';
import api from '~/api';
const cx = classNames.bind(styles);

export default function AppTreeView({ changeObject }) {
    const [value, setValue] = useState();
    const [treeData, setTreeData] = useState([]);

    useEffect(() => {
        api.get('forge/oss/buckets/all')
            .then((response) => {
                // {id: 'speam-test', text: 'speam-test', type: 'bucket', children: true}
                console.log(response);
                const arrFile = (response?.data || []).map((file) => {
                    const newValue = {};
                    newValue.value = file.id;
                    newValue.id = file.id;
                    newValue.pId = '';
                    newValue.title = <span> <Tag color="#f50">b</Tag> {file.text}</span>;
                    newValue.type = file.type;
                    newValue.isLeaf = file.type === 'object';
                    return newValue;
                });
                setTreeData(arrFile);
                console.log(arrFile);
            })
            .catch((err) => console.log(err));
    }, []);

    const onLoadData = ({ id }) => {
        return api
            .get(`forge/oss/buckets?id=${id}`)
            .then((response) => {
                // {id: 'speam-test', text: 'speam-test', type: 'bucket', children: true}
                console.log(response);
                const arrFile = (response?.data || []).map((file) => {
                    const newValue = {};
                    newValue.value = file.id;
                    newValue.id = file.id;
                    newValue.pId = id;
                    newValue.title = <span> <Tag color="#87d068">o</Tag> {file.text}</span>;
                    newValue.type = file.type;
                    newValue.isLeaf = file.type === 'object';
                    return newValue;
                });
                setTreeData(treeData.concat(arrFile));
                console.log('old', arrFile);
            })
            .catch((err) => console.log(err));
    };

    const onChange = (newValue) => {
        const item = treeData.find(value => value.value === newValue)
        if (item.isLeaf) {
            console.log(item)
            setValue(newValue);
            changeObject(newValue)
        } else {
            setValue(null);
        }
    };

    return (
        <TreeSelect
            treeDataSimpleMode
            style={{
                width: '200%',
            }}
            value={value}
            dropdownStyle={{
                maxHeight: 400,
                overflow: 'auto',
            }}
            placeholder="Please select"
            onChange={onChange}
            loadData={onLoadData}
            treeData={treeData}
        />
    );
}
