import { useState } from 'react';
import { PRICING_PLANS, ITEM_PACKS, getPlanDetails, getPlanBadgeProps } from '../lib/pricing';
import type { PlanId } from '../lib/pricing';
import { supabase } from '../lib/supabase';

interface PricingModalProps {
    onClose: () => void;
    currentPlanId: PlanId;
}

export function PricingModal({ onClose, currentPlanId }: PricingModalProps) {
    const [selectedTab, setSelectedTab] = useState<'plans' | 'packs'>('plans');

    const handlePlanUpgrade = async (planId: PlanId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Por favor inicia sesión para realizar la compra.');
            return;
        }
        
        const plan = getPlanDetails(planId);
        const checkoutUrl = `https://quemepongo.lemonsqueezy.com/checkout/buy/${plan.lemonSqueezyVariantId}?checkout[custom][user_id]=${user.id}`;
        window.open(checkoutUrl, '_blank');
    };

    const handleItemPackPurchase = async (packId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Por favor inicia sesión para realizar la compra.');
            return;
        }
        
        const pack = ITEM_PACKS[packId as keyof typeof ITEM_PACKS];
        const checkoutUrl = `https://quemepongo.lemonsqueezy.com/checkout/buy/${pack.lemonSqueezyVariantId}?checkout[custom][user_id]=${user.id}`;
        window.open(checkoutUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors"
                >
                    <i className="fas fa-times text-zinc-400"></i>
                </button>

                {/* Header */}
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-3">
                        Elige tu Plan Ideal
                    </h2>
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                        Comienza gratis y mejora cuando lo necesites
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-3 mb-10">
                    <button
                        onClick={() => setSelectedTab('plans')}
                        className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            selectedTab === 'plans'
                                ? 'bg-black text-white shadow-lg'
                                : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                        }`}
                    >
                        <i className="fas fa-gem mr-2"></i>
                        Planes Mensuales
                    </button>
                    <button
                        onClick={() => setSelectedTab('packs')}
                        className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            selectedTab === 'packs'
                                ? 'bg-black text-white shadow-lg'
                                : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                        }`}
                    >
                        <i className="fas fa-box mr-2"></i>
                        Packs de Prendas
                    </button>
                </div>

                {/* Plans Tab */}
                {selectedTab === 'plans' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Free Plan */}
                        <div className={`rounded-[2.5rem] p-8 border-4 transition-all ${
                            currentPlanId === 'free' 
                                ? 'border-black bg-zinc-50' 
                                : 'border-zinc-100 bg-white'
                        }`}>
                            <div className="mb-6">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest mb-4 ${getPlanBadgeProps('free').className}`}>
                                    <i className={`fas ${getPlanBadgeProps('free').icon}`}></i>
                                    {getPlanBadgeProps('free').label}
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">
                                    {PRICING_PLANS.FREE.name}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black">$0</span>
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase">para siempre</span>
                                </div>
                            </div>
                            
                            <ul className="space-y-3 mb-8">
                                {PRICING_PLANS.FREE.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <i className="fas fa-check text-green-500 text-[10px] mt-0.5"></i>
                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wide">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {currentPlanId === 'free' ? (
                                <button disabled className="w-full py-4 bg-zinc-100 text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                                    Plan Actual
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handlePlanUpgrade('free')}
                                    disabled
                                    className="w-full py-4 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                                >
                                    Cambiar a Gratis
                                </button>
                            )}
                        </div>

                        {/* Pro Plan */}
                        <div className={`rounded-[2.5rem] p-8 border-4 transition-all relative ${
                            currentPlanId === 'pro' 
                                ? 'border-amber-500 bg-amber-50/50' 
                                : 'border-amber-500 bg-white'
                        }`}>
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-2 rounded-full text-[7px] font-black uppercase tracking-widest shadow-lg">
                                <i className="fas fa-star mr-1"></i>
                                Más Popular
                            </div>
                            <div className="mb-6">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest mb-4 ${getPlanBadgeProps('pro').className}`}>
                                    <i className={`fas ${getPlanBadgeProps('pro').icon}`}></i>
                                    {getPlanBadgeProps('pro').label}
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">
                                    {PRICING_PLANS.PRO.name}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black">${PRICING_PLANS.PRO.price}</span>
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase">MXN / mes</span>
                                </div>
                            </div>
                            
                            <ul className="space-y-3 mb-8">
                                {PRICING_PLANS.PRO.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <i className="fas fa-check text-amber-500 text-[10px] mt-0.5"></i>
                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wide">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {currentPlanId === 'pro' ? (
                                <button disabled className="w-full py-4 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                                    Plan Actual
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handlePlanUpgrade('pro')}
                                    className="w-full py-4 bg-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    Comenzar Pro
                                </button>
                            )}
                        </div>

                        {/* Unlimited Plan */}
                        <div className={`rounded-[2.5rem] p-8 border-4 transition-all ${
                            currentPlanId === 'unlimited' 
                                ? 'border-purple-500 bg-purple-50/50' 
                                : 'border-purple-500 bg-white'
                        }`}>
                            <div className="mb-6">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest mb-4 ${getPlanBadgeProps('unlimited').className}`}>
                                    <i className={`fas ${getPlanBadgeProps('unlimited').icon}`}></i>
                                    {getPlanBadgeProps('unlimited').label}
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">
                                    {PRICING_PLANS.UNLIMITED.name}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black">${PRICING_PLANS.UNLIMITED.price}</span>
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase">MXN / mes</span>
                                </div>
                            </div>
                            
                            <ul className="space-y-3 mb-8">
                                {PRICING_PLANS.UNLIMITED.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <i className="fas fa-check text-purple-500 text-[10px] mt-0.5"></i>
                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wide">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {currentPlanId === 'unlimited' ? (
                                <button disabled className="w-full py-4 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                                    Plan Actual
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handlePlanUpgrade('unlimited')}
                                    className="w-full py-4 bg-purple-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    Obtener Ilimitado
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Item Packs Tab */}
                {selectedTab === 'packs' && (
                    <div>
                        <div className="bg-zinc-50 rounded-3xl p-8 mb-8 text-center">
                            <i className="fas fa-box text-4xl text-zinc-300 mb-4"></i>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                Compra packs de prendas adicionales - Pago único, tuyo para siempre
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.values(ITEM_PACKS).map(pack => (
                                <div 
                                    key={pack.id}
                                    className="bg-white border-2 border-zinc-200 rounded-[2.5rem] p-8 hover:border-black hover:scale-105 transition-all group"
                                >
                                    <div className="mb-6">
                                        <h3 className="text-xl font-black uppercase tracking-tighter mb-2 group-hover:text-black text-zinc-600">
                                            {pack.name}
                                        </h3>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                                            {pack.description}
                                        </p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black">${pack.price}</span>
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase">MXN - pago único</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleItemPackPurchase(pack.id)}
                                        className="w-full py-4 bg-zinc-100 text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white hover:scale-105 active:scale-95 transition-all"
                                    >
                                        <i className="fas fa-shopping-cart mr-2"></i>
                                        Comprar Pack
                                    </button>
                                </div>
                            ))}
                        </div>

                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest text-center mt-8">
                            Los packs se acumulan con tu límite base del plan
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
