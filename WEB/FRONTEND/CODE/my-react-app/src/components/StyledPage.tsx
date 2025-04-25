import React from 'react';
import { FileCode, GitBranch, Star, Eye, GitFork } from 'lucide-react'; // Example icons

// Renaming component for clarity
const GitHubRepoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Header Section */}
      <header className="bg-gray-100 border-b border-gray-300 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Repo Name and Owner */}
          <div className="flex items-center gap-2 text-xl text-blue-600 hover:underline cursor-pointer transition-colors duration-200">
            <GitBranch size={20} className="text-gray-500" />
            <span className="font-semibold text-gray-700">owner</span>
            <span className="text-gray-400">/</span>
            <span className="font-bold">repository-name</span>
            <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-gray-600 bg-gray-200 border border-gray-300 rounded-full">Public</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500">
              <Eye size={16} /> Watch <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-gray-200 rounded-full">1</span>
            </button>
            <button className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500">
              <GitFork size={16} /> Fork <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-gray-200 rounded-full">0</span>
            </button>
            <button className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500">
              <Star size={16} /> Star <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-gray-200 rounded-full">0</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-100 border-b border-gray-300">
         <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center border-b-2 border-transparent -mb-px">
                 {/* Active Tab */}
                <a href="#" className="flex items-center gap-1 px-4 py-3 text-sm font-semibold text-gray-800 border-b-2 border-orange-500 hover:text-gray-900 transition-colors duration-150">
                    <FileCode size={16} /> Code
                </a>
                {/* Other Tabs */}
                <a href="#" className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150">
                    {/* Placeholder for Issues Icon */} Issues <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-gray-200 rounded-full">5</span>
                </a>
                 <a href="#" className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150">
                    {/* Placeholder for PR Icon */} Pull requests <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-gray-200 rounded-full">2</span>
                </a>
                 <a href="#" className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150">
                    {/* Placeholder for Actions Icon */} Actions
                </a>
                 <a href="#" className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150">
                    {/* Placeholder for Projects Icon */} Projects
                </a>
                 <a href="#" className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150">
                    {/* Placeholder for Wiki Icon */} Wiki
                </a>
                 <a href="#" className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150">
                    {/* Placeholder for Security Icon */} Security
                </a>
                 <a href="#" className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150">
                    {/* Placeholder for Insights Icon */} Insights
                </a>
            </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6 mt-4">

        {/* File Browser / Code Section */}
        <div className="flex-grow lg:w-3/4 bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
          {/* File Header */}
          <div className="bg-gray-50 border-b border-gray-300 px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200">
                <GitBranch size={16} /> main <span className="ml-1">▼</span>
              </button>
              <span className="text-sm text-gray-500">/</span>
              {/* Breadcrumbs could go here */}
            </div>
            <button className="px-3 py-1 text-sm font-medium text-white bg-green-600 border border-green-700 rounded-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500">
              Add file
            </button>
          </div>

          {/* File List */}
          <ul className="divide-y divide-gray-200">
            {/* Example File Item */}
            <li className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors duration-150 cursor-pointer animate-fade-in">
              <div className="flex items-center gap-3">
                {/* Placeholder for File Icon */}
                <span className="text-blue-500 hover:underline">src</span>
              </div>
              <span className="text-sm text-gray-600 truncate max-w-xs">Initial commit</span>
              <span className="text-sm text-gray-500 whitespace-nowrap">1 day ago</span>
            </li>
             <li className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors duration-150 cursor-pointer animate-fade-in animation-delay-100">
              <div className="flex items-center gap-3">
                {/* Placeholder for File Icon */}
                <span className="text-blue-500 hover:underline">README.md</span>
              </div>
              <span className="text-sm text-gray-600 truncate max-w-xs">Update README</span>
              <span className="text-sm text-gray-500 whitespace-nowrap">2 hours ago</span>
            </li>
             <li className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors duration-150 cursor-pointer animate-fade-in animation-delay-200">
              <div className="flex items-center gap-3">
                {/* Placeholder for File Icon */}
                <span className="text-blue-500 hover:underline">package.json</span>
              </div>
              <span className="text-sm text-gray-600 truncate max-w-xs">Add dependencies</span>
              <span className="text-sm text-gray-500 whitespace-nowrap">5 days ago</span>
            </li>
            {/* Add more file/folder items here */}
          </ul>

          {/* README Section (Optional) */}
           <div className="border-t border-gray-300 mt-4 p-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    {/* Placeholder for README Icon */} README.md
                </h3>
                <article className="prose prose-sm max-w-none text-gray-700">
                    <p>This is where the content of the README file would be displayed.</p>
                    <p>It uses Tailwind's typography plugin (`prose`) for basic styling.</p>
                    <pre><code className="language-bash">npm install</code></pre>
                </article>
           </div>
        </div>

        {/* Sidebar Section */}
        <aside className="lg:w-1/4 space-y-6">
          {/* About Section */}
          <section>
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-sm text-gray-600 mb-3">
              A brief description of the repository goes here. It might include the purpose and goals.
            </p>
            <a href="#" className="text-sm text-blue-600 hover:underline block mb-3">https://example.com</a>
            <div className="flex flex-wrap gap-1 mb-4">
                <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 cursor-pointer transition-colors duration-150">react</span>
                <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 cursor-pointer transition-colors duration-150">typescript</span>
                <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 cursor-pointer transition-150">tailwind-css</span>
            </div>
             <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"><Star size={16} /> 0 stars</span>
                <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"><Eye size={16} /> 1 watching</span>
                <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"><GitFork size={16} /> 0 forks</span>
            </div>
          </section>

          {/* Releases Section */}
          <section className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold mb-2">Releases</h2>
            <a href="#" className="text-sm text-blue-600 hover:underline">No releases published</a>
            {/* Or display latest release */}
          </section>

          {/* Packages Section */}
           <section className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold mb-2">Packages</h2>
            <p className="text-sm text-gray-600">No packages published</p>
          </section>

          {/* Contributors Section */}
          <section className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold mb-2">Contributors</h2>
            {/* List contributors here */}
            <p className="text-sm text-gray-600">No contributors yet.</p>
          </section>

           {/* Languages Section */}
          <section className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold mb-3">Languages</h2>
             <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                <div className="bg-blue-500 hover:opacity-90 transition-opacity duration-150" style={{ width: '60%' }} title="TypeScript 60%"></div>
                <div className="bg-yellow-400 hover:opacity-90 transition-opacity duration-150" style={{ width: '30%' }} title="JavaScript 30%"></div>
                <div className="bg-red-500 hover:opacity-90 transition-opacity duration-150" style={{ width: '10%' }} title="HTML 10%"></div>
            </div>
            <ul className="mt-2 text-xs space-y-1">
                <li className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span> TypeScript <span className="text-gray-500">60%</span></li>
                <li className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span> JavaScript <span className="text-gray-500">30%</span></li>
                <li className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-500"></span> HTML <span className="text-gray-500">10%</span></li>
            </ul>
          </section>
        </aside>
      </main>

      {/* Footer (Optional) */}
      <footer className="max-w-7xl mx-auto mt-8 p-4 border-t border-gray-300 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} GitHub, Inc. {/* Placeholder */}
      </footer>
    </div>
  );
};

// Exporting with the new name
export default GitHubRepoPage;