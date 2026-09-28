import {setting} from '../../lib';
export async function GET(){const [fee,form,mode]=await Promise.all([setting('fee','5000'),setting('form',''),setting('paystack_mode','simulation')]);return Response.json({fee:Number(fee),form:form?JSON.parse(form):null,testOnly:true,mode})}
