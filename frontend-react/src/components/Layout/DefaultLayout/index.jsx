import Header from './Header';
import Content from './Content';
import Footer from './Footer';
import './DefaultLayout.scss';

export default function DefaultLayout({ children }) {
    return (
        <>
            <Header />
            <Content>{children}</Content>
            <Footer />
        </>
    );
}
