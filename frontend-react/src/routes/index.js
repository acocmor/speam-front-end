import Home from '~/pages/Home';
import Login from '~/pages/Login';
import NotFound from '~/pages/NotFound';
import Register from '~/pages/Register';

const publicRoutes = [
    { path: '/', component: Home},
    { path: '/login', component: Login},
    { path: '/register', component: Register},
    { path: '*', component: NotFound, layout: null },
];

const privateRoutes = [];

export { publicRoutes, privateRoutes };
