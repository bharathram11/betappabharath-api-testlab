import { products } from "../../_store";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const product = products.find((item) => item.id === Number(id)); return product ? Response.json({ data: product }) : Response.json({ error: "Not found", message: `Product ${id} does not exist` }, { status: 404 }); }
