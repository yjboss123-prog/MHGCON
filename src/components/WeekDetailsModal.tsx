import { useState, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { Task, Role } from '../types';
import { getWeekWork, saveWeekWork } from '../lib/api';
import { compressImage } from '../lib/utils';
import { Language, useTranslation } from '../lib/i18n';

interface WeekDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  year: number;
  week: number;
  currentRole: Role;
  language: Language;
}

interface WeekWork {
  work_description: string;
  photos: string[];
}

export function WeekDetailsModal({
  isOpen,
  onClose,
  task,
  year,
  week,
  currentRole,
  language,
}: WeekDetailsModalProps) {
  const t = useTranslation(language);
  const [workDescription, setWorkDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      loadWeekWork();
    }
  }, [isOpen, task, year, week]);

  const loadWeekWork = async () => {
    if (!task) return;

    setIsLoading(true);
    try {
      const data = await getWeekWork(task.id, year, week);
      if (data) {
        setWorkDescription(data.work_description);
        setPhotos(data.photos || []);
      } else {
        setWorkDescription('');
        setPhotos([]);
      }
    } catch (error) {
      console.error('Error loading week work:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!task) return;

    setIsSaving(true);
    try {
      await saveWeekWork(task.id, year, week, workDescription, photos);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving week work:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i]);
        newPhotos.push(compressed);
      } catch (error) {
        console.error('Error compressing image:', error);
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const canEdit = task?.owner_roles.includes(currentRole) || currentRole === 'Project Manager';

  if (!isOpen || !task) return null;

  const weekStartDate = new Date(year, 0, 1 + (week - 1) * 7);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{task.name}</h2>
              <p className="text-sm text-slate-600 mt-1">
                {t.weekDetails} {week}, {year} ({weekStartDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')} -{' '}
                {weekEndDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4">
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.workDescription}
                  </label>
                  {isEditing ? (
                    <textarea
                      value={workDescription}
                      onChange={(e) => setWorkDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      rows={5}
                      placeholder="Describe the work done during this week..."
                    />
                  ) : (
                    <div className="bg-slate-50 rounded-lg px-4 py-3 min-h-[100px]">
                      {workDescription || (
                        <span className="text-slate-400 italic">{t.noWorkDescription}</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t.photos}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Work photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {isEditing && (
                          <button
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {isEditing && (
                      <label className="border-2 border-dashed border-slate-300 rounded-lg h-32 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors">
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <span className="text-sm text-slate-500">{t.uploadPhoto}</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  {!isEditing && photos.length === 0 && (
                    <div className="text-slate-400 italic text-sm">{t.noPhotos}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {canEdit ? t.canEdit : t.cannotEdit}
            </div>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      loadWeekWork();
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                    disabled={isSaving}
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSaving}
                  >
                    {isSaving ? t.saving : t.saveChanges}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    {t.close}
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
                    >
                      {t.edit}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
