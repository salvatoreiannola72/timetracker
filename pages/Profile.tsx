import React from 'react';
import { User, Mail, MapPin, Calendar, Edit2, LogOut } from 'lucide-react';

export default function Profile() {
    const [isEditing, setIsEditing] = React.useState(false);

    const profileData = {
        name: 'Giovanni Rossi',
        email: 'giovanni@example.com',
        location: 'Milano, Italia',
        joinDate: 'Gennaio 2023',
        bio: 'Sviluppatore Full Stack appassionato di tecnologie web',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Giovanni'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header Card */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-6">
                            <img
                                src={profileData.avatar}
                                alt={profileData.name}
                                className="w-24 h-24 rounded-full border-4 border-blue-500"
                            />
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    {profileData.name}
                                </h1>
                                <p className="text-slate-600">{profileData.bio}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            <Edit2 size={18} />
                            Modifica
                        </button>
                    </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Mail className="text-blue-500" size={20} />
                            <span className="text-slate-600 text-sm font-medium">Email</span>
                        </div>
                        <p className="text-slate-900 font-semibold">{profileData.email}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <MapPin className="text-blue-500" size={20} />
                            <span className="text-slate-600 text-sm font-medium">Ubicazione</span>
                        </div>
                        <p className="text-slate-900 font-semibold">{profileData.location}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Calendar className="text-blue-500" size={20} />
                            <span className="text-slate-600 text-sm font-medium">Membro da</span>
                        </div>
                        <p className="text-slate-900 font-semibold">{profileData.joinDate}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <User className="text-blue-500" size={20} />
                            <span className="text-slate-600 text-sm font-medium">Stato</span>
                        </div>
                        <p className="text-slate-900 font-semibold">Attivo</p>
                    </div>
                </div>

                {/* Action Button */}
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium">
                    <LogOut size={18} />
                    Esci
                </button>
            </div>
        </div>
    );
}