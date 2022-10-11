import Home from '~/pages/Home';
import NotFound from '~/pages/NotFound';

const publicRoutes = [
    { path: '/', component: Home},
    { path: '*', component: NotFound, layout: null },
];

const privateRoutes = [];

export { publicRoutes, privateRoutes };
