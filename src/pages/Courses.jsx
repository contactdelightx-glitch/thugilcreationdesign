import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, PlayCircleIcon, Certificate01Icon } from '@hugeicons/core-free-icons';
import CourseList from '../components/CourseList';
import CourseDetail from './CourseDetail';

const goToList = () => document.getElementById('courses-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function Courses({ id, onNavigate, user, onNeedLogin, onSessionExpired }) {
  if (id) return <CourseDetail id={id} onNavigate={onNavigate} user={user} onNeedLogin={onNeedLogin} onSessionExpired={onSessionExpired} />;

  return (
    <main>
      <section className="cbanner">
        <div className="cbanner-inner">
          <div className="cbanner-text">
            <h1>Learn saree design, <em>step by step</em></h1>
            <p>Video lessons you can watch at your own pace, taught by people who design sarees every day.</p>
            <div className="cbanner-actions">
              <button type="button" className="cbanner-btn" onClick={goToList}>Explore courses <HugeiconsIcon icon={ArrowDown01Icon} size={18} strokeWidth={1.8} /></button>
            </div>
            <ul className="cbanner-points">
              <li><HugeiconsIcon icon={PlayCircleIcon} size={20} strokeWidth={1.5} /> Learn at your own pace</li>
              <li><HugeiconsIcon icon={Certificate01Icon} size={20} strokeWidth={1.5} /> Earn a certificate</li>
            </ul>
          </div>

        </div>
        <svg className="cbanner-wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60V28C240 -4 480 -4 720 24s480 28 720 -4V60z" /></svg>
      </section>

      <CourseList onOpen={(courseId) => onNavigate('Courses', courseId)} />
    </main>
  );
}
