import React, { useState } from 'react';
import { PHP_PROJECT_FILES, PhpFileItem } from '../../data/phpProjectFiles';
import {
  FolderTree,
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  Database,
  ExternalLink,
  Sparkles,
  Server,
  FileText,
  Boxes,
  Code2
} from 'lucide-react';

export const PhpExportPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<PhpFileItem>(PHP_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [copiedCmds, setCopiedCmds] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todos los Archivos', icon: FolderTree },
    { id: 'views', label: 'Vistas Principales', icon: FileCode },
    { id: 'config', label: 'Configuración & DB', icon: Server },
    { id: 'database', label: 'Base de Datos MySQL', icon: Database },
    { id: 'api', label: 'Endpoints API REST', icon: Boxes },
    { id: 'gas', label: 'Google Apps Script', icon: FileText },
    { id: 'docs', label: 'Documentación & Git', icon: Terminal },
  ];

  const filteredFiles = activeCategory === 'all'
    ? PHP_PROJECT_FILES
    : PHP_PROJECT_FILES.filter(f => f.category === activeCategory);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const gitCommands = `# 1. Inicializar repositorio Git en tu carpeta
git init

# 2. Agregar todos los archivos generados
git add .

# 3. Realizar el primer commit
git commit -m "feat: Sistema Integral de Snack, POS, Caja, KDS y Google Sheets en PHP 8"

# 4. Establecer la rama principal
git branch -M main

# 5. Conectar con tu repositorio en GitHub (Reemplaza con tu URL)
git remote add origin https://github.com/TU_USUARIO/snack-pos-php.git

# 6. Subir todo a GitHub
git push -u origin main`;

  const handleCopyGit = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopiedCmds(true);
    setTimeout(() => setCopiedCmds(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-8 shadow-2xl border border-orange-500/30">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-orange-200 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Código PHP 8 + MySQL + Google Apps Script
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Exportar Proyecto PHP & Subir a GitHub
          </h1>
          <p className="text-orange-100 text-sm sm:text-base leading-relaxed">
            Se ha generado la suite completa en PHP nativo modular para que puedas subirla a tu repositorio de GitHub, desplegarla en XAMPP, Laragon, CPanel o cualquier hosting web tradicional con base de datos MySQL.
          </p>
        </div>
      </div>

      {/* GitHub Quick Instructions Bar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold border border-amber-300">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">Comandos de Terminal para GitHub</h3>
              <p className="text-xs text-neutral-500">Ejecuta estos pasos en tu consola para publicar el proyecto en tu cuenta de GitHub</p>
            </div>
          </div>

          <button
            onClick={handleCopyGit}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-xs shadow-sm transition-all flex items-center gap-2"
          >
            {copiedCmds ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCmds ? '¡Comandos Copiados!' : 'Copiar Comandos Git'}</span>
          </button>
        </div>

        <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 font-mono text-xs text-amber-300 overflow-x-auto whitespace-pre">
          {gitCommands}
        </div>
      </div>

      {/* Interactive Code Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Files List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pb-2">
            {categories.map(c => {
              const Icon = c.icon;
              const active = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    active ? 'bg-amber-500 text-neutral-950 font-black shadow-sm' : 'bg-white text-neutral-600 hover:text-neutral-950 border border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Files List Card */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-2 space-y-1 max-h-[580px] overflow-y-auto shadow-sm">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-50 text-amber-900 border border-amber-300 font-medium'
                      : 'text-neutral-700 hover:bg-neutral-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <FileCode className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-amber-600' : 'text-neutral-400'}`} />
                    <div>
                      <p className="font-bold text-neutral-900">{file.name}</p>
                      <span className="text-[10px] text-neutral-500 block line-clamp-1 mt-0.5">{file.description}</span>
                    </div>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-mono font-bold">
                    {file.language}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Viewer & Actions (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
          
          {/* File Top Bar */}
          <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-600" />
              <div>
                <span className="font-mono text-xs font-bold text-neutral-900">{selectedFile.path}</span>
                <p className="text-[11px] text-neutral-500">{selectedFile.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-semibold border border-neutral-200 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Archivo'}</span>
              </button>

              <button
                onClick={handleDownloadFile}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-black shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
            </div>
          </div>

          {/* Code Viewer Body */}
          <div className="flex-1 p-4 bg-neutral-900 overflow-x-auto max-h-[580px] overflow-y-auto">
            <pre className="font-mono text-xs text-neutral-200 leading-relaxed">
              <code>{selectedFile.content}</code>
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
};
