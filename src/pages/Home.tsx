import DSLInput from "../components/FileInput/DSLInput";
import GraphViewer from "../components/GraphViewer/GraphViewer";
import { parseDSL } from "../core/parser/dslParser";
import { useState } from "react";

export default function Home() {
  const [dslString, setDslString] = useState("");

  const handleLoad = (text: string) => {
    setDslString(text);
    const nfa = parseDSL(text);
    console.log("DSLString:", dslString, "NFA:", nfa);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">NFA → DFA Visualizer</h1>
      <DSLInput onLoad={handleLoad} />
      <GraphViewer />
    </div>
  );
}
