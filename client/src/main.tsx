// import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import App from './App';
import { PublicPage } from "./components/PublicPage";
import { readPublicPageData, type PublicPageData } from "./lib/public-page-data";
import { queryClient } from "./lib/queryClient";
import "./index.css";

const data = readPublicPageData();
if (data?.products) queryClient.setQueryData(["/api/shop/products"], { result: data.products });

function PublicEntry({ data }: { data: PublicPageData }) {
  const [interactive, setInteractive] = useState(false);
  useEffect(() => { setInteractive(true); }, []);
  // Hydrate the semantic document before enabling existing interactive components.
  return interactive ? <App /> : <PublicPage data={data} />;
}

const root = document.getElementById("root")!;
if (data && data.url.split("?")[0] !== "/diagnostics") {
  hydrateRoot(root, <PublicEntry data={data} />);
} else {
  createRoot(root).render(<App />);
}
