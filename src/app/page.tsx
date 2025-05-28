import { ReviewClient } from "@/components/review-client";
import { readdir, stat, readFile } from "node:fs/promises";
import { join, normalize } from "node:path";

const getAllFilesFromDir = async (dir: string, excludeDirs: string[] = []): Promise<string[]> => {
  let results: string[] = [];
  const list = await readdir(dir);
  
  for (const file of list) {
    const filePath = join(dir, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        const subResults = await getAllFilesFromDir(filePath, excludeDirs);
        results = results.concat(subResults);
      }
    } else {
      // Normaliza o caminho para usar barras normais e remove o prefixo ./
      const normalizedPath = normalize(filePath)
        .replace(/^[.][\\/]/, "") // Remove ./ ou .\
        .replace(/\\/g, "/"); // Substitui todas as barras invertidas por barras normais
      results.push(normalizedPath);
    }
  }
  
  return results;
};

const getAllFilesFromGit = async () => {
  try {
    const files = await getAllFilesFromDir(".", [".git", ".next", "node_modules"]);
    return { files };
  } catch (error) {
    console.error("Error listing files:", error);
    return { files: [] };
  }
};

async function getSelectedFile(filePath: string) {
  try {
    if (!filePath) {
      return { error: "File path is required" };
    }

    const content = await readFile(filePath, 'utf-8');
    return { content };
  } catch (error) {
    console.error("Error fetching file content:", error);
    return { error: "Failed to fetch file content" };
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ path: string }>;
}) {
  const { path } = await searchParams;
  const data = await getAllFilesFromGit();
  const selectedFile = await getSelectedFile(path);

  console.log(data)


  return (
    <div className=''>
      <header className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold'>Code Review AI Agent</h1>
      </header>

      <div className='page-container'>
        <h2 className='text-xl font-bold'>
          Hi! I&apos;m Code Review Agent, your personal code review AI agent.
        </h2>
        <p>
          I&apos;m here to help you review your code. I&apos;ll give you a
          detailed analysis of the code, including security vulnerabilities,
          code style, and performance optimizations.
        </p>
        
        <ReviewClient
          files={data?.files || []}
          selectedFile={selectedFile}
          file={path}
        />
      </div>
    </div>
  );
}