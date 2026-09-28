import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'FEDMOGA Membership Test Portal',description:'Private FEDMOGA registration test preview',icons:{icon:'/logo.jpg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
