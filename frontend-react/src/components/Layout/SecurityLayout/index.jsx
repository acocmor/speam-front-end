import React, { useEffect } from 'react';
import cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

export default function SecurityLayout({ children }) {
    const navigate = useNavigate();
    const tokenCookie = cookies.get('token');

    useEffect(() => {
        if (tokenCookie === undefined) {
            navigate('/login')
        }
    }, []);

    return children;
}
