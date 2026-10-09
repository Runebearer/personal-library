import { useNavigate } from 'react-router-dom'

export function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 px-6 py-12">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 w-fit rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        ← Retour
      </button>

      <div className="mx-auto max-w-3xl flex-1">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Politique de Confidentialité & Mentions RGPD</h1>
        <p className="mb-8 text-base text-gray-600">
          <strong>Application :</strong> My-personal-online-library
        </p>
        <p className="mb-8 text-sm text-gray-500">
          <strong>Dernière mise à jour :</strong> 9 octobre 2026
        </p>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">1. Responsable de traitement</h2>
          <p className="mb-4 text-gray-700">L'application My-personal-online-library est éditée par un particulier à titre personnel.</p>
          <p className="text-gray-700">
            Pour toute question, demande d'exercice de vos droits ou réclamation concernant vos données personnelles,
            vous pouvez contacter l'administrateur à l'adresse e-mail suivante :{' '}
            <code className="rounded bg-gray-200 px-2 py-1">contact</code>.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">2. Données personnelles collectées</h2>
          <p className="mb-4 text-gray-700">
            Dans le cadre de l'utilisation de l'application, les données suivantes sont collectées et traitées :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Données de compte et d'identification :</strong> Nom, prénom et adresse e-mail (transmis
              automatiquement via le service d'authentification Google Login).
            </li>
            <li>
              <strong>Données relatives à la bibliothèque :</strong> Les titres, auteurs, catégories et métadonnées des
              livres que vous ajoutez, organisez ou modifiez au sein de votre espace personnel.
            </li>
            <li>
              <strong>Données techniques :</strong> Identifiants techniques générés par Firebase pour assurer le
              fonctionnement et la sécurité du compte.
            </li>
          </ul>
          <p className="text-gray-700">La création d'un compte est obligatoire pour accéder au service et enregistrer vos livres.</p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">3. Finalités et bases légales du traitement</h2>
          <p className="mb-4 text-gray-700">Vos données sont collectées pour les finalités suivantes :</p>
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>Gestion du compte et authentification :</strong> Permettre votre connexion sécurisée à
              l'application via Google Login (Base légale : exécution des Conditions Générales d'Utilisation / Contrat).
            </li>
            <li>
              <strong>Fourniture du service de bibliothèque :</strong> Stocker et afficher vos listes de livres
              personnelles (Base légale : exécution du service).
            </li>
            <li>
              <strong>Notifications (fonctionnalité à venir) :</strong> Vous adresser des rappels ou informations
              relatives à votre utilisation de l'application (Base légale : intérêt légitime ou consentement selon le
              paramétrage).
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">4. Hébergement et sous-traitants</h2>
          <p className="mb-4 text-gray-700">L'infrastructure de l'application repose sur des services tiers de confiance :</p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Hébergeur et Base de données :</strong> Google Cloud / Firebase (Firestore).
            </li>
            <li>
              <strong>Sous-traitance et transfert de données :</strong> Firebase est opéré par Google LLC. Les
              éventuels transferts de données hors de l'Union européenne sont encadrés par les clauses contractuelles
              types de la Commission européenne afin de garantir un niveau de protection adéquat.
            </li>
            <li>
              <strong>Absence de marqueurs tiers :</strong> Aucun outil de traçage, de ciblage publicitaire ou
              d'analyse d'audience tiers (type Google Analytics, Mixpanel, etc.) n'est utilisé dans l'application.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">5. Durées de conservation et anonymisation</h2>
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>Durée de vie du compte :</strong> Vos données d'identification et votre bibliothèque de livres
              sont conservées pendant toute la durée d'activation de votre compte utilisateur.
            </li>
            <li>
              <strong>Suppression du compte :</strong> En cas de demande ou d'action de suppression de votre compte,
              l'ensemble de vos données d'identification (nom, e-mail) est immédiatement et définitivement effacé.
            </li>
            <li>
              <strong>Anonymisation à des fins statistiques :</strong> Conformément à la réglementation, les données
              relatives aux listes de livres peuvent être conservées sous forme strictement anonymisée (dissociées de
              manière irréversible de votre identité). Ces données anonymes ne constituent plus des données personnelles
              au sens du RGPD et servent exclusivement à établir des statistiques globales d'utilisation (ex. livres les
              plus répertoriés).
            </li>
            <li>
              <strong>Inactivité prolongée :</strong> Tout compte demeuré inactif pendant une durée continue de 3 ans
              fera l'objet d'un e-mail de préavis avant suppression définitive et/ou anonymisation des données.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">6. Vos droits sur vos données</h2>
          <p className="mb-4 text-gray-700">
            Conformément au Règlement Général sur la Protection des Données (RGPD - UE 2016/679) et à la Loi
            Informatique et Libertés :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Droit d'accès et de rectification :</strong> Vous pouvez consulter ou corriger vos informations à
              tout moment.
            </li>
            <li>
              <strong>Droit à l'effacement (Droit à l'oubli) :</strong> Vous pouvez demander la suppression complète de
              votre compte et de vos données.
            </li>
            <li>
              <strong>Droit à la limitation et d'opposition :</strong> Vous pouvez vous opposer à certains traitements
              ou en demander la limitation.
            </li>
            <li>
              <strong>Droit à la portabilité :</strong> Vous pouvez demander l'exportation des données enregistrées dans
              votre bibliothèque.
            </li>
          </ul>
          <p className="mb-4 text-gray-700">
            Pour exercer l'un de ces droits, adressez votre demande à :{' '}
            <code className="rounded bg-gray-200 px-2 py-1">contact</code>.
          </p>
          <p className="text-gray-700">
            Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous disposez du droit
            d'introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés sur{' '}
            <a href="https://www.cnil.fr/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              cnil.fr
            </a>
            ).
          </p>
        </section>
      </div>

      <div className="mt-12 flex justify-center">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Retour
        </button>
      </div>
    </div>
  )
}
