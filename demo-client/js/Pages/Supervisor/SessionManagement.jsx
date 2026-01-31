import React, { useState, useEffect } from 'react';
import { supervisorService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../../Components/Loading';
import PersianDatePicker from '../../Components/PersianDatePicker';
import Input from '../../Components/Input';
import Button from '../../Components/Button';

function SessionManagement() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'create'
    const [loading, setLoading] = useState(true);
    const [halls, setHalls] = useState([]);
    const [selectedHallId, setSelectedHallId] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    
    // Template form state
    const [templateForm, setTemplateForm] = useState({
        day_of_week: null,
        start_time: '',
        price: '',
        max_participants: '',
        is_active: true,
    });

    // Manual session form state
    const [sessionForm, setSessionForm] = useState({
        hall_id: '',
        session_template_id: '',
        game_master_id: '',
        date: '',
        start_time: '',
        price: '',
        max_participants: '',
        status: 'upcoming',
    });

    const [gameMasters, setGameMasters] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchHalls();
        fetchGameMasters();
    }, []);

    useEffect(() => {
        if (selectedHallId) {
            fetchTemplates();
        } else {
            setTemplates([]);
        }
    }, [selectedHallId]);

    const fetchHalls = async () => {
        try {
            setLoading(true);
            const data = await supervisorService.getHalls();
            setHalls(data.data || data || []);
            if (data.data && data.data.length > 0) {
                setSelectedHallId(data.data[0].id);
            } else if (data.length > 0) {
                setSelectedHallId(data[0].id);
            }
        } catch (error) {
            showToast('خطا در بارگذاری سالن‌ها', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        if (!selectedHallId) return;
        try {
            setLoadingTemplates(true);
            const data = await supervisorService.getSessionTemplates(selectedHallId);
            setTemplates(data.data || data || []);
        } catch (error) {
            showToast('خطا در بارگذاری قالب‌های سانس', 'error');
        } finally {
            setLoadingTemplates(false);
        }
    };

    const fetchGameMasters = async () => {
        try {
            const data = await supervisorService.getGameMasters();
            setGameMasters(data.game_masters || []);
        } catch (error) {
            console.error('Error fetching game masters:', error);
        }
    };

    const handleCreateTemplate = () => {
        setEditingTemplate(null);
        setTemplateForm({
            day_of_week: null,
            start_time: '',
            price: '',
            max_participants: '',
            is_active: true,
        });
        setShowTemplateModal(true);
    };

    const handleEditTemplate = (template) => {
        setEditingTemplate(template);
        setTemplateForm({
            day_of_week: template.day_of_week ?? null,
            start_time: template.start_time,
            price: template.price.toString(),
            max_participants: template.max_participants.toString(),
            is_active: template.is_active,
        });
        setShowTemplateModal(true);
    };

    const handleSaveTemplate = async () => {
        if (!selectedHallId) {
            showToast('لطفا سالن را انتخاب کنید', 'error');
            return;
        }

        try {
            setSubmitting(true);
            // Normalize start_time to HH:mm format (remove seconds if present)
            let startTime = templateForm.start_time;
            if (startTime && startTime.length > 5) {
                startTime = startTime.substring(0, 5);
            }
            
            const templateData = {
                day_of_week: templateForm.day_of_week === null || templateForm.day_of_week === '' 
                    ? null 
                    : parseInt(templateForm.day_of_week),
                start_time: startTime,
                price: parseFloat(templateForm.price),
                max_participants: parseInt(templateForm.max_participants),
                is_active: templateForm.is_active,
            };

            if (editingTemplate) {
                await supervisorService.updateSessionTemplate(editingTemplate.id, templateData);
                showToast('قالب سانس با موفقیت به‌روزرسانی شد', 'success');
            } else {
                await supervisorService.createSessionTemplate(selectedHallId, templateData);
                showToast('قالب سانس با موفقیت ایجاد شد', 'success');
            }

            setShowTemplateModal(false);
            fetchTemplates();
        } catch (error) {
            showToast(error.response?.data?.message || 'خطا در ذخیره قالب سانس', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        if (!window.confirm('آیا مطمئن هستید که می‌خواهید این قالب را حذف کنید؟')) {
            return;
        }

        try {
            await supervisorService.deleteSessionTemplate(templateId);
            showToast('قالب سانس با موفقیت حذف شد', 'success');
            fetchTemplates();
        } catch (error) {
            showToast(error.response?.data?.message || 'خطا در حذف قالب سانس', 'error');
        }
    };

    const handleCreateSession = async () => {
        try {
            setSubmitting(true);
            // Normalize start_time to HH:mm format (remove seconds if present)
            let startTime = sessionForm.start_time;
            if (startTime && startTime.length > 5) {
                startTime = startTime.substring(0, 5);
            }
            
            const sessionData = {
                hall_id: parseInt(sessionForm.hall_id),
                date: sessionForm.date,
                start_time: startTime,
                price: parseFloat(sessionForm.price),
                max_participants: parseInt(sessionForm.max_participants),
                status: sessionForm.status,
            };

            if (sessionForm.session_template_id) {
                sessionData.session_template_id = parseInt(sessionForm.session_template_id);
            }

            if (sessionForm.game_master_id) {
                sessionData.game_master_id = parseInt(sessionForm.game_master_id);
            }

            await supervisorService.createSession(sessionData);
            showToast('سانس با موفقیت ایجاد شد', 'success');
            
            // Reset form
            setSessionForm({
                hall_id: '',
                session_template_id: '',
                game_master_id: '',
                date: '',
                start_time: '',
                price: '',
                max_participants: '',
                status: 'upcoming',
            });
        } catch (error) {
            showToast(error.response?.data?.message || 'خطا در ایجاد سانس', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const getDayName = (dayOfWeek) => {
        if (dayOfWeek === null || dayOfWeek === undefined) {
            return 'همه روزها';
        }
        const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
        return days[dayOfWeek] || '';
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            <div className="mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">مدیریت سانس‌ها</h1>
                <p className="text-sm sm:text-base text-gray-400">مدیریت قالب‌های سانس و ایجاد سانس دستی</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 sm:gap-2 border-b border-red-900/50 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-all whitespace-nowrap ${
                        activeTab === 'templates'
                            ? 'text-red-400 border-b-2 border-red-400'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    قالب‌های سانس
                </button>
                <button
                    onClick={() => setActiveTab('create')}
                    className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-all whitespace-nowrap ${
                        activeTab === 'create'
                            ? 'text-red-400 border-b-2 border-red-400'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    ایجاد سانس دستی
                </button>
            </div>

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="space-y-4 sm:space-y-6">
                    {/* Hall Selection */}
                    <div className="cafe-card rounded-xl p-3 sm:p-4">
                        <label className="block text-xs sm:text-sm text-gray-400 mb-2">انتخاب سالن</label>
                        <select
                            value={selectedHallId || ''}
                            onChange={(e) => setSelectedHallId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                        >
                            <option value="">انتخاب سالن</option>
                            {halls.map((hall) => (
                                <option key={hall.id} value={hall.id}>
                                    {hall.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Templates List */}
                    {selectedHallId && (
                        <>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                                <h2 className="text-lg sm:text-xl font-semibold text-white">قالب‌های سانس</h2>
                                <button
                                    onClick={handleCreateTemplate}
                                    className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold"
                                >
                                    افزودن قالب جدید
                                </button>
                            </div>

                            {loadingTemplates ? (
                                <Loading />
                            ) : (
                                <div className="space-y-4">
                                    {templates.length === 0 ? (
                                        <div className="text-center py-12 cafe-card rounded-xl">
                                            <p className="text-gray-400">قالبی برای این سالن یافت نشد</p>
                                        </div>
                                    ) : (
                                        templates.map((template) => (
                                            <div
                                                key={template.id}
                                                className="cafe-card rounded-xl p-3 sm:p-5"
                                            >
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                                                    <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                                                        <div>
                                                            <p className="text-xs sm:text-sm text-gray-400">روز هفته</p>
                                                            <p className="text-sm sm:text-base text-white font-semibold">
                                                                {getDayName(template.day_of_week)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs sm:text-sm text-gray-400">زمان شروع</p>
                                                            <p className="text-sm sm:text-base text-white font-semibold">{template.start_time}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs sm:text-sm text-gray-400">قیمت</p>
                                                            <p className="text-sm sm:text-base text-white font-semibold">
                                                                {new Intl.NumberFormat('fa-IR').format(template.price)} تومان
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs sm:text-sm text-gray-400">ظرفیت</p>
                                                            <p className="text-sm sm:text-base text-white font-semibold">{template.max_participants} نفر</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs sm:text-sm text-gray-400">وضعیت</p>
                                                            <p className={`text-sm sm:text-base font-semibold ${
                                                                template.is_active ? 'text-green-400' : 'text-gray-400'
                                                            }`}>
                                                                {template.is_active ? 'فعال' : 'غیرفعال'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 w-full sm:w-auto">
                                                        <button
                                                            onClick={() => handleEditTemplate(template)}
                                                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold"
                                                        >
                                                            ویرایش
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTemplate(template.id)}
                                                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-semibold"
                                                        >
                                                            حذف
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Create Session Tab */}
            {activeTab === 'create' && (
                <div className="cafe-card rounded-xl p-4 sm:p-6 space-y-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">ایجاد سانس دستی</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">سالن *</label>
                            <select
                                value={sessionForm.hall_id}
                                onChange={async (e) => {
                                    const hallId = e.target.value;
                                    setSessionForm({ ...sessionForm, hall_id: hallId, session_template_id: '' });
                                    // Fetch templates for selected hall
                                    if (hallId) {
                                        try {
                                            setLoadingTemplates(true);
                                            const data = await supervisorService.getSessionTemplates(parseInt(hallId));
                                            setTemplates(data.data || data || []);
                                        } catch (error) {
                                            console.error('Error fetching templates:', error);
                                        } finally {
                                            setLoadingTemplates(false);
                                        }
                                    }
                                }}
                                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                                required
                            >
                                <option value="">انتخاب سالن</option>
                                {halls.map((hall) => (
                                    <option key={hall.id} value={hall.id}>
                                        {hall.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {sessionForm.hall_id && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">قالب سانس (اختیاری)</label>
                                <select
                                    value={sessionForm.session_template_id}
                                    onChange={(e) => {
                                        const templateId = e.target.value;
                                        setSessionForm({ ...sessionForm, session_template_id: templateId });
                                        if (templateId) {
                                            const template = templates.find(t => t.id === parseInt(templateId));
                                            if (template) {
                                                setSessionForm(prev => ({
                                                    ...prev,
                                                    start_time: template.start_time,
                                                    price: template.price.toString(),
                                                    max_participants: template.max_participants.toString(),
                                                }));
                                            }
                                        }
                                    }}
                                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                                >
                                    <option value="">بدون قالب</option>
                                    {templates.filter(t => t.hall_id === parseInt(sessionForm.hall_id)).map((template) => (
                                        <option key={template.id} value={template.id}>
                                            {getDayName(template.day_of_week ?? null)} - {template.start_time}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">تاریخ *</label>
                            <PersianDatePicker
                                value={sessionForm.date}
                                onChange={(date) => setSessionForm({ ...sessionForm, date })}
                                placeholder="تاریخ را انتخاب کنید"
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">زمان شروع *</label>
                            <input
                                type="time"
                                value={sessionForm.start_time}
                                onChange={(e) => setSessionForm({ ...sessionForm, start_time: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">قیمت (تومان) *</label>
                            <input
                                type="number"
                                value={sessionForm.price}
                                onChange={(e) => setSessionForm({ ...sessionForm, price: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                                min="0"
                                step="1000"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">حداکثر تعداد نفرات *</label>
                            <input
                                type="number"
                                value={sessionForm.max_participants}
                                onChange={(e) => setSessionForm({ ...sessionForm, max_participants: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                                min="1"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Game Master (اختیاری)</label>
                            <select
                                value={sessionForm.game_master_id}
                                onChange={(e) => setSessionForm({ ...sessionForm, game_master_id: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                            >
                                <option value="">انتخاب نشده</option>
                                {gameMasters.map((gm) => (
                                    <option key={gm.id} value={gm.id}>
                                        {gm.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleCreateSession}
                            disabled={submitting || !sessionForm.hall_id || !sessionForm.date || !sessionForm.start_time || !sessionForm.price || !sessionForm.max_participants}
                            className="w-full"
                        >
                            {submitting ? 'در حال ایجاد...' : 'ایجاد سانس'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
                    <div className="cafe-card rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
                            {editingTemplate ? 'ویرایش قالب سانس' : 'ایجاد قالب سانس جدید'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">روز هفته</label>
                                <select
                                    value={templateForm.day_of_week ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                                        setTemplateForm({ ...templateForm, day_of_week: value });
                                    }}
                                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                                >
                                    <option value="">همه روزها</option>
                                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                        <option key={day} value={day}>
                                            {getDayName(day)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">زمان شروع *</label>
                                <input
                                    type="time"
                                    value={templateForm.start_time}
                                    onChange={(e) => setTemplateForm({ ...templateForm, start_time: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">قیمت (تومان) *</label>
                                <input
                                    type="number"
                                    value={templateForm.price}
                                    onChange={(e) => setTemplateForm({ ...templateForm, price: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                                    min="0"
                                    step="1000"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">حداکثر تعداد نفرات *</label>
                                <input
                                    type="number"
                                    value={templateForm.max_participants}
                                    onChange={(e) => setTemplateForm({ ...templateForm, max_participants: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                                    min="1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={templateForm.is_active}
                                        onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-400">فعال</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button
                                onClick={handleSaveTemplate}
                                disabled={submitting || !templateForm.start_time || !templateForm.price || !templateForm.max_participants}
                                className="flex-1"
                            >
                                {submitting ? 'در حال ذخیره...' : 'ذخیره'}
                            </Button>
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-semibold"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SessionManagement;

