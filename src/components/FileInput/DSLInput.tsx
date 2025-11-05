import React, { useState } from "react";

interface Props {
  onLoad: (text: string) => void;
}

export default function DSLInput({ onLoad }: Props) {
  const [text, setText] = useState("");

  return (
    <div className="p-4 border rounded">
      <textarea
        className="w-full h-32 border p-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Fügen Sie hier Ihre DSL ein... 
        Z.B.:
        # @NAME SimpleNFA
        # @REGEX a*b

        states q0 q1 q2
        start q0
        accept q2
        alphabet a b

        q0 a q0
        q0 b q1
        q1 b q2"
      />
      <button
        onClick={() => onLoad(text)}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        NFA laden
      </button>
    </div>
  );
}
