import {verifyPayment} from '../../../paystack';
export async function GET(req:Request){const u=new URL(req.url),ref=u.searchParams.get('reference');try{if(!ref)throw Error('Missing reference');const token=await verifyPayment(ref);return Response.redirect(new URL('/?continue='+encodeURIComponent(token),u.origin),303)}catch{return Response.redirect(new URL('/?payment=unverified',u.origin),303)}}
