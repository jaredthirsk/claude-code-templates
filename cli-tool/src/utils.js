const fs = require('fs-extra');
const path = require('path');

async function detectProject(targetDir) {
  const detectedLanguages = [];
  const detectedFrameworks = [];
  
  // Check for package.json (JavaScript/TypeScript)
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const packageJson = await fs.readJson(packageJsonPath);
      detectedLanguages.push('javascript-typescript');
      
      // Detect frameworks
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (dependencies.react || dependencies['@types/react']) {
        detectedFrameworks.push('react');
      }
      if (dependencies.vue || dependencies['@vue/cli']) {
        detectedFrameworks.push('vue');
      }
      if (dependencies['@angular/core']) {
        detectedFrameworks.push('angular');
      }
      if (dependencies.express || dependencies.fastify || dependencies.koa) {
        detectedFrameworks.push('node');
      }
    } catch (error) {
      console.warn('Could not parse package.json');
    }
  }
  
  // Check for Python files
  const pythonFiles = await findFilesByExtension(targetDir, ['.py']);
  if (pythonFiles.length > 0) {
    detectedLanguages.push('python');
    
    // Check for Python frameworks
    const requirementsPath = path.join(targetDir, 'requirements.txt');
    const pipfilePath = path.join(targetDir, 'Pipfile');
    const pyprojectPath = path.join(targetDir, 'pyproject.toml');
    
    if (await fs.pathExists(requirementsPath)) {
      const requirements = await fs.readFile(requirementsPath, 'utf-8');
      if (requirements.includes('django')) detectedFrameworks.push('django');
      if (requirements.includes('flask')) detectedFrameworks.push('flask');
      if (requirements.includes('fastapi')) detectedFrameworks.push('fastapi');
    }
    
    // Check for Django settings
    if (await findFilesByPattern(targetDir, 'settings.py').length > 0) {
      detectedFrameworks.push('django');
    }
    
    // Check for Flask app
    if (await findFilesByPattern(targetDir, 'app.py').length > 0) {
      detectedFrameworks.push('flask');
    }
  }
  
  // Check for Ruby files
  const rubyFiles = await findFilesByExtension(targetDir, ['.rb']);
  const gemfilePath = path.join(targetDir, 'Gemfile');
  const gemfileLockPath = path.join(targetDir, 'Gemfile.lock');
  
  if (rubyFiles.length > 0 || await fs.pathExists(gemfilePath)) {
    detectedLanguages.push('ruby');
    
    // Check for Ruby frameworks
    if (await fs.pathExists(gemfilePath)) {
      try {
        const gemfile = await fs.readFile(gemfilePath, 'utf-8');
        if (gemfile.includes('rails')) {
          detectedFrameworks.push('rails');
        }
        if (gemfile.includes('sinatra')) {
          detectedFrameworks.push('sinatra');
        }
      } catch (error) {
        console.warn('Could not parse Gemfile');
      }
    }
    
    // Check for Rails application structure
    const railsAppPath = path.join(targetDir, 'config', 'application.rb');
    const railsRoutesPath = path.join(targetDir, 'config', 'routes.rb');
    if (await fs.pathExists(railsAppPath) || await fs.pathExists(railsRoutesPath)) {
      detectedFrameworks.push('rails');
    }
    
    // Check for Rakefile (common in Rails and Ruby projects)
    const rakefilePath = path.join(targetDir, 'Rakefile');
    if (await fs.pathExists(rakefilePath)) {
      try {
        const rakefile = await fs.readFile(rakefilePath, 'utf-8');
        if (rakefile.includes('Rails.application.load_tasks')) {
          detectedFrameworks.push('rails');
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
  }
  
  // Check for Rust files
  const rustFiles = await findFilesByExtension(targetDir, ['.rs']);
  const cargoPath = path.join(targetDir, 'Cargo.toml');
  if (rustFiles.length > 0 || await fs.pathExists(cargoPath)) {
    detectedLanguages.push('rust');
  }
  
  // Check for .NET files
  const csharpFiles = await findFilesByExtension(targetDir, ['.cs']);
  const fsharpFiles = await findFilesByExtension(targetDir, ['.fs']);
  const csprojFiles = await findFilesByExtension(targetDir, ['.csproj']);
  const fsprojFiles = await findFilesByExtension(targetDir, ['.fsproj']);
  const slnFiles = await findFilesByExtension(targetDir, ['.sln']);
  
  if (csharpFiles.length > 0 || fsharpFiles.length > 0 || csprojFiles.length > 0 || fsprojFiles.length > 0 || slnFiles.length > 0) {
    detectedLanguages.push('dotnet');
    
    // Check for .NET frameworks
    for (const csprojFile of csprojFiles) {
      try {
        const csprojContent = await fs.readFile(csprojFile, 'utf-8');
        
        // Check for ASP.NET Core Web API
        if (csprojContent.includes('Microsoft.AspNetCore') && 
           (csprojContent.includes('Microsoft.AspNetCore.OpenApi') || 
            csprojContent.includes('Swashbuckle.AspNetCore'))) {
          detectedFrameworks.push('aspnet-webapi');
        }
        
        // Check for Blazor Server
        if (csprojContent.includes('Microsoft.AspNetCore.Components.Server') ||
            csprojContent.includes('>blazorserver<')) {
          detectedFrameworks.push('blazor-server');
        }
        
        // Check for Blazor WebAssembly
        if (csprojContent.includes('Microsoft.AspNetCore.Components.WebAssembly') ||
            csprojContent.includes('>blazorwasm<')) {
          detectedFrameworks.push('blazor-wasm');
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
    
    // Check for Blazor project structure
    const blazorPagesPath = path.join(targetDir, 'Components', 'Pages');
    const blazorComponentsPath = path.join(targetDir, 'Components');
    const wwwrootPath = path.join(targetDir, 'wwwroot');
    
    if (await fs.pathExists(blazorPagesPath) || await fs.pathExists(blazorComponentsPath)) {
      // Check for Blazor Server (has SignalR hub references)
      const programFiles = await findFilesByPattern(targetDir, 'Program.cs');
      for (const programFile of programFiles) {
        try {
          const programContent = await fs.readFile(programFile, 'utf-8');
          if (programContent.includes('MapBlazorHub') || programContent.includes('AddServerSideBlazor')) {
            detectedFrameworks.push('blazor-server');
          }
          if (programContent.includes('WebAssembly') || programContent.includes('blazorwasm')) {
            detectedFrameworks.push('blazor-wasm');
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    }
    
    // Check for ASP.NET Core structure
    const controllersPath = path.join(targetDir, 'Controllers');
    if (await fs.pathExists(controllersPath)) {
      detectedFrameworks.push('aspnet-webapi');
    }
  }
  
  // Check for Go files
  const goFiles = await findFilesByExtension(targetDir, ['.go']);
  const goModPath = path.join(targetDir, 'go.mod');
  if (goFiles.length > 0 || await fs.pathExists(goModPath)) {
    detectedLanguages.push('go');
  }
  
  return {
    detectedLanguage: detectedLanguages[0] || null,
    detectedFramework: detectedFrameworks[0] || null,
    allLanguages: detectedLanguages,
    allFrameworks: detectedFrameworks,
    projectFiles: await getProjectSummary(targetDir)
  };
}

async function findFilesByExtension(dir, extensions, maxDepth = 2) {
  const files = [];
  
  async function searchDir(currentDir, currentDepth) {
    if (currentDepth > maxDepth) return;
    
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await searchDir(fullPath, currentDepth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Directory might not be accessible
    }
  }
  
  await searchDir(dir, 0);
  return files;
}

async function findFilesByPattern(dir, pattern, maxDepth = 2) {
  const files = [];
  
  async function searchDir(currentDir, currentDepth) {
    if (currentDepth > maxDepth) return;
    
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await searchDir(fullPath, currentDepth + 1);
        } else if (entry.isFile() && entry.name.includes(pattern)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not be accessible
    }
  }
  
  await searchDir(dir, 0);
  return files;
}

async function getProjectSummary(targetDir) {
  const summary = {
    hasGit: await fs.pathExists(path.join(targetDir, '.git')),
    hasNodeModules: await fs.pathExists(path.join(targetDir, 'node_modules')),
    hasVenv: await fs.pathExists(path.join(targetDir, 'venv')) || await fs.pathExists(path.join(targetDir, '.venv')),
    hasBundle: await fs.pathExists(path.join(targetDir, 'vendor', 'bundle')),
    configFiles: []
  };
  
  // Check for common config files
  const configFiles = [
    'package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.js',
    'requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile',
    'Gemfile', 'Gemfile.lock', 'Rakefile', 'config.ru',
    'Cargo.toml', 'go.mod',
    '*.sln', '*.csproj', '*.fsproj', 'global.json', 'nuget.config', 'Directory.Build.props',
    '.gitignore', 'README.md'
  ];
  
  for (const configFile of configFiles) {
    if (await fs.pathExists(path.join(targetDir, configFile))) {
      summary.configFiles.push(configFile);
    }
  }
  
  return summary;
}

module.exports = {
  detectProject,
  findFilesByExtension,
  findFilesByPattern,
  getProjectSummary
};