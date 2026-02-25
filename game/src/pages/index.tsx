import Head from "next/head";
import dynamic from "next/dynamic";

const AppWithoutSSR = dynamic(() => import("@/App"), { ssr: false });

export default function Home() {
    return (
        <>
            <Head>
                <title>The Quiet Protocol</title>
                <meta name="description" content="The mind was never meant to be archived. A psychological horror experience." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.png" />
            </Head>
            <main style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                backgroundColor: '#05070B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <AppWithoutSSR />
            </main>
        </>
    );
}
