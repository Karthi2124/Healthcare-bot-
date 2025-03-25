import HealthAssistant from '@/components/HealthAssistant';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-xl p-6 md:p-8">
        <HealthAssistant />
      </div>
    </div>
  );
};

export default Index;
