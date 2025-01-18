import React, { useState, useCallback } from 'react';
import { Copy, Clipboard, ArrowRightLeft, Check } from 'lucide-react';

function App() {
  const [sqlInput, setSqlInput] = useState('');
  const [mermaidOutput, setMermaidOutput] = useState('');
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedMermaid, setCopiedMermaid] = useState(false);

  const convertToMermaid = useCallback(() => {
    const tables: Record<string, { fields: string[], relations: string[] }> = {};
    const lines = sqlInput.split('\n');
    let currentTable = '';

    lines.forEach(line => {
      line = line.trim();
      
      // Match CREATE TABLE statements
      const tableMatch = line.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?/i);
      if (tableMatch) {
        currentTable = tableMatch[1];
        tables[currentTable] = { fields: [], relations: [] };
        return;
      }

      // Match foreign key constraints
      const fkMatch = line.match(/FOREIGN\s+KEY\s+\(([^)]+)\)\s+REFERENCES\s+(\w+)\s*\(([^)]+)\)/i);
      if (fkMatch && currentTable) {
        const sourceField = fkMatch[1].replace(/[`"]/g, '').trim();
        const targetTable = fkMatch[2];
        tables[currentTable].relations.push(
          `${currentTable} }|--|| ${targetTable} : "${sourceField}"`
        );
        return;
      }

      // Match field definitions
      const fieldMatch = line.match(/^\s*[`"]?(\w+)[`"]?\s+([\w\(\)]+)([^,)]*)/i);
      if (fieldMatch && currentTable && !line.startsWith(')')) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        const constraints = fieldMatch[3];
        const isPK = constraints.toLowerCase().includes('primary key');
        const fieldStr = `${fieldName} ${fieldType}${isPK ? ' PK' : ''}`;
        tables[currentTable].fields.push(fieldStr);
      }
    });

    // Generate Mermaid ERD
    let mermaid = 'erDiagram\n';
    
    // Add entities and their attributes
    Object.entries(tables).forEach(([tableName, table]) => {
      if (table.fields.length > 0) {
        mermaid += `  ${tableName} {\n`;
        table.fields.forEach(field => {
          mermaid += `    ${field}\n`;
        });
        mermaid += '  }\n';
      }
    });

    // Add relationships
    Object.values(tables).forEach(table => {
      table.relations.forEach(relation => {
        mermaid += `  ${relation}\n`;
      });
    });

    setMermaidOutput(mermaid);
  }, [sqlInput]);

  const copyToClipboard = async (text: string, type: 'sql' | 'mermaid') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'sql') {
        setCopiedSQL(true);
        setTimeout(() => setCopiedSQL(false), 2000);
      } else {
        setCopiedMermaid(true);
        setTimeout(() => setCopiedMermaid(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SQL to Mermaid ERD Converter</h1>
          <p className="text-gray-600">Convert your SQL CREATE TABLE statements into Mermaid Entity Relationship Diagrams</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SQL Input */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">SQL Input</h2>
              <button
                onClick={() => copyToClipboard(sqlInput, 'sql')}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors relative group"
                title={copiedSQL ? 'Copied!' : 'Copy SQL'}
              >
                <div className="transition-all duration-200 transform">
                  {copiedSQL ? (
                    <Check size={20} className="text-green-500" />
                  ) : (
                    <Copy size={20} className="group-hover:scale-110" />
                  )}
                </div>
              </button>
            </div>
            <textarea
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              placeholder="Paste your SQL CREATE TABLE statements here..."
              className="w-full h-[400px] p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Mermaid Output */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Mermaid ERD</h2>
              <button
                onClick={() => copyToClipboard(mermaidOutput, 'mermaid')}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors relative group"
                title={copiedMermaid ? 'Copied!' : 'Copy Mermaid'}
              >
                <div className="transition-all duration-200 transform">
                  {copiedMermaid ? (
                    <Check size={20} className="text-green-500" />
                  ) : (
                    <Copy size={20} className="group-hover:scale-110" />
                  )}
                </div>
              </button>
            </div>
            <textarea
              value={mermaidOutput}
              readOnly
              placeholder="Your Mermaid ERD will appear here..."
              className="w-full h-[400px] p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none bg-gray-50"
            />
          </div>
        </div>

        {/* Convert Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={convertToMermaid}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold hover:scale-105 transform transition-transform duration-200"
          >
            <ArrowRightLeft size={20} />
            Convert to Mermaid
          </button>
        </div>

        {/* Example Usage */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Example Usage</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">Paste SQL CREATE TABLE statements like this:</p>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
{`CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255)
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  title VARCHAR(255),
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;