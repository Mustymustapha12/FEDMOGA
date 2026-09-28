import {getChatGPTUser,chatGPTSignInPath} from './chatgpt-auth';
import Portal from './portal';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <Portal signedIn={!!user} signInUrl={chatGPTSignInPath('/')} />}
