import Home from '~/pages/Home';
import Login from '~/pages/Login';
import NotFound from '~/pages/NotFound';
import Register from '~/pages/Register';

const publicRoutes = [
    // { path: '/', component: Home},
    { path: '/login', component: Login, layout: null},
    { path: '/register', component: Register, layout: null},
    { path: '*', component: NotFound, layout: null },
];

const privateRoutes = [
    { path: '/', component: Home},
];

export { publicRoutes, privateRoutes };
