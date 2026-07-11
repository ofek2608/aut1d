import styles from './AboutSection.module.css'

const GITHUB_URL = 'https://github.com/ofek2608/aut1d'

export default function AboutSection() {
  return (
    <section class="panel-section">
      <div class="section-header">About</div>
      <p class={styles.description}>
        Aut1D is an interactive playground for one-dimensional cellular automata.
        Define states and rules, paint an initial pattern, and watch it evolve row by row.
      </p>
      <div class={styles.credit}>
        <span class={styles.author}>Made by OfekN</span>
        <a
          class={styles.githubLink}
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          title="View source on GitHub"
        >
          <i class="fa-brands fa-github" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
