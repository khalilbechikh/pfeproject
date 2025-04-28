import React from 'react';
import { Star, GitFork, Users, Code, Share2, Plus } from 'lucide-react';

const languageColors = {
    JavaScript: "bg-yellow-400",
    TypeScript: "bg-blue-500",
    Python: "bg-indigo-500",
    Rust: "bg-orange-500",
    CSS: "bg-purple-500",
    HTML: "bg-red-500"
};

interface Repository {
    name: string;
    description: string;
    language: keyof typeof languageColors;
    stars: number;
    forks: number;
    updated: string;
    contributors: number;
}

const RepositoriesList = ({ darkMode }: { darkMode: boolean }) => {
    const repositories: Repository[] = [
        {
            name: "Neural Network Visualizer",
            description: "Interactive visualization tool for neural networks with real-time training data",
            language: "TypeScript",
            stars: 128,
            forks: 35,
            updated: "2 days ago",
            contributors: 8
        },
        {
            name: "Quantum Algorithm Simulator",
            description: "Simulate quantum computing algorithms and visualize qubit states",
            language: "Python",
            stars: 246,
            forks: 87,
            updated: "5 days ago",
            contributors: 12
        },
        {
            name: "3D Code Architecture",
            description: "Generate interactive 3D visualizations of code architecture and dependencies",
            language: "JavaScript",
            stars: 193,
            forks: 42,
            updated: "1 week ago",
            contributors: 5
        },
        {
            name: "Blockchain Explorer",
            description: "Advanced blockchain visualization and transaction analysis tool",
            language: "Rust",
            stars: 317,
            forks: 103,
            updated: "3 days ago",
            contributors: 15
        }
    ];

    return (
        <>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>Your Repositories</h1>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage and explore your code repositories</p>
                </div>
                <button className={`flex items-center space-x-2 px-4 py-2 ${darkMode ? 'bg-violet-600 hover:bg-violet-500' : 'bg-cyan-600 hover:bg-cyan-500'} text-white rounded-lg transition-all duration-300 hover:shadow-lg ${darkMode ? 'hover:shadow-violet-500/30' : 'hover:shadow-cyan-500/30'} transform hover:-translate-y-0.5`}>
                    <Plus size={18} />
                    <span>New</span>
                </button>
            </div>
            <div className="grid grid-cols-1 gap-6">
                {repositories.map((repository, index) => (
                    <div
                        key={index}
                        className={`${darkMode ? 'bg-gray-800/60 border-gray-700 hover:border-gray-600' : 'bg-white/70 border-gray-200 hover:border-cyan-300'} backdrop-blur-sm group border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center space-x-3">
                                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-violet-400' : 'text-cyan-600'} group-hover:underline`}>
                                            {repository.name}
                                        </h3>
                                        <span className={`text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded-full`}>
                                            Public
                                        </span>
                                    </div>
                                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{repository.description}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}>
                                        <Star size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                                    </button>
                                    <button className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}>
                                        <GitFork size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center text-sm gap-y-2">
                                <div className="flex items-center mr-5">
                                    <span className={`inline-block w-3 h-3 rounded-full ${languageColors[repository.language]} mr-2`}></span>
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{repository.language}</span>
                                </div>
                                <div className="flex items-center mr-5 group">
                                    <Star size={16} className={`mr-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'} group-hover:text-yellow-400 transition-colors`} />
                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{repository.stars}</span>
                                </div>
                                <div className="flex items-center mr-5">
                                    <GitFork size={16} className="mr-1.5 text-gray-400" />
                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{repository.forks}</span>
                                </div>
                                <div className="flex items-center mr-5">
                                    <Users size={16} className="mr-1.5 text-gray-400" />
                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{repository.contributors} contributors</span>
                                </div>
                                <span className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-sm ml-auto`}>Updated {repository.updated}</span>
                            </div>
                        </div>
                        <div className={`px-6 py-3 flex justify-between items-center border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/80'} backdrop-blur-sm`}>
                            <div className="flex -space-x-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className={`w-8 h-8 rounded-full border-2 ${darkMode ? 'border-gray-800 bg-gray-700' : 'border-white bg-gray-100'} flex items-center justify-center text-xs font-medium`}>
                                        {['A', 'B', 'C'][i]}
                                    </div>
                                ))}
                                {repository.contributors > 3 && (
                                    <div className={`w-8 h-8 rounded-full border-2 ${darkMode ? 'border-gray-800 bg-gray-700 text-gray-300' : 'border-white bg-gray-100 text-gray-600'} flex items-center justify-center text-xs font-medium`}>
                                        +{repository.contributors - 3}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <button className={`px-3 py-1.5 text-sm rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition-colors`}>
                                    <Code size={14} className="inline-block mr-1.5" />
                                    Code
                                </button>
                                <button className={`px-3 py-1.5 text-sm rounded-md ${darkMode ? 'bg-violet-600/30 hover:bg-violet-600/50 text-violet-400' : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700'} transition-colors`}>
                                    <Share2 size={14} className="inline-block mr-1.5" />
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default RepositoriesList;